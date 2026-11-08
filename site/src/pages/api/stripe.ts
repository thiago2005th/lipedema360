import type { APIRoute } from 'astro';
import { env, cabecalhoServico } from '../../lib/acesso';

export const prerender = false;

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

const enc = new TextEncoder();
function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function igual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// Confere a assinatura do Stripe (header "Stripe-Signature": t=...,v1=...) e rejeita eventos com mais de 5 minutos.
async function assinaturaValida(corpo: string, cabecalho: string, segredo: string) {
  const partes = Object.fromEntries(cabecalho.split(',').map((p) => p.split('=') as [string, string]));
  const t = partes['t'];
  const v1 = cabecalho.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!t || v1.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const chave = await crypto.subtle.importKey('raw', enc.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const esperado = hex(await crypto.subtle.sign('HMAC', chave, enc.encode(`${t}.${corpo}`)));
  return v1.some((s) => igual(s, esperado));
}

// Webhook do Stripe: libera ou bloqueia o acesso Profissional.
// Libera: checkout.session.completed (pago) e invoice.paid.
// Bloqueia: customer.subscription.deleted, charge.refunded, charge.dispute.created.
export const POST: APIRoute = async ({ request }) => {
  const segredo = env('STRIPE_WEBHOOK_SECRET');
  const servico = env('SUPABASE_SERVICE_ROLE_KEY');
  const base = (env('PUBLIC_SUPABASE_URL') || '').replace(/\/$/, '');
  if (!segredo || !servico || !base) return json({ error: 'Webhook não configurado' }, 503);

  const bruto = await request.text();
  const ok = await assinaturaValida(bruto, request.headers.get('stripe-signature') || '', segredo);
  if (!ok) return json({ error: 'Assinatura inválida' }, 401);

  let ev: any;
  try { ev = JSON.parse(bruto); } catch { return json({ error: 'JSON inválido' }, 400); }
  const o = ev?.data?.object || {};
  const agora = new Date().toISOString();
  const cabecalho = { ...cabecalhoServico(servico), 'Content-Type': 'application/json' };

  async function liberar(email: string, nome: string, cliente: string) {
    email = email.toLowerCase().trim();
    if (!email) return json({ error: 'E-mail não encontrado' }, 400);
    const r = await fetch(`${base}/rest/v1/assinaturas_lipedema360?on_conflict=email`, {
      method: 'POST',
      headers: { ...cabecalho, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ email, name: nome, active: true, source: 'stripe', hotmart_transaction: cliente, expires_at: null, updated_at: agora }),
    });
    return r.ok ? json({ success: true, email, acesso: true }) : json({ error: 'Falha ao gravar assinatura' }, 500);
  }

  async function bloquear(cliente: string) {
    if (!cliente) return json({ message: 'Sem cliente' });
    const r = await fetch(`${base}/rest/v1/assinaturas_lipedema360?hotmart_transaction=eq.${encodeURIComponent(cliente)}`, {
      method: 'PATCH',
      headers: { ...cabecalho, Prefer: 'return=minimal' },
      body: JSON.stringify({ active: false, updated_at: agora }),
    });
    return r.ok ? json({ success: true, acesso: false }) : json({ error: 'Falha ao gravar assinatura' }, 500);
  }

  switch (ev.type) {
    case 'checkout.session.completed':
      if (o.payment_status !== 'paid') return json({ message: 'Aguardando pagamento' });
      return liberar(o.customer_details?.email || o.customer_email || '', o.customer_details?.name || '', String(o.customer || ''));
    case 'invoice.paid':
      return liberar(o.customer_email || '', o.customer_name || '', String(o.customer || ''));
    case 'customer.subscription.deleted':
      return bloquear(String(o.customer || ''));
    case 'charge.refunded':
    case 'charge.dispute.created':
      return bloquear(String(o.customer || ''));
    default:
      return json({ message: 'Evento ignorado', tipo: ev.type });
  }
};

export const ALL: APIRoute = () => new Response(null, { status: 405 });
