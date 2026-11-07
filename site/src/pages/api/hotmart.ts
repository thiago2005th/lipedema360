import type { APIRoute } from 'astro';
import { env, cabecalhoServico } from '../../lib/acesso';

export const prerender = false;

const LIBERA = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'];
const BLOQUEIA = ['PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK', 'PURCHASE_CANCELED', 'PURCHASE_EXPIRED', 'SUBSCRIPTION_CANCELLATION'];

function igual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

// Webhook da Hotmart: libera ou bloqueia o acesso Profissional pelo e-mail do comprador.
export const POST: APIRoute = async ({ request, url }) => {
  const segredo = env('HOTMART_WEBHOOK_SECRET');
  const servico = env('SUPABASE_SERVICE_ROLE_KEY');
  const base = (env('PUBLIC_SUPABASE_URL') || '').replace(/\/$/, '');
  const produtos = (env('HOTMART_PRODUCT_IDS') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!segredo || !servico || !base || produtos.length === 0) return json({ error: 'Webhook não configurado' }, 503);

  let corpo: any = {};
  try { corpo = await request.json(); } catch { return json({ error: 'JSON inválido' }, 400); }

  const token = request.headers.get('x-hotmart-hottok') || request.headers.get('hottok') || corpo?.hottok || url.searchParams.get('hottok') || '';
  if (!igual(String(token), segredo)) return json({ error: 'Token inválido' }, 401);

  const evento = String(corpo?.event || corpo?.type || '');
  const d = corpo?.data || corpo;
  const email = String(d?.buyer?.email || d?.subscriber?.email || d?.consumer?.email || '').toLowerCase().trim();
  const nome = String(d?.buyer?.name || d?.subscriber?.name || d?.consumer?.name || '');
  const transacao = String(d?.purchase?.transaction || d?.transaction || '');
  const produtoId = String(d?.product?.id || d?.product?.ucode || '');

  // Só age em produtos do Lipedema360 (lista em HOTMART_PRODUCT_IDS). Outros produtos são ignorados.
  if (!produtos.includes(produtoId)) return json({ message: 'Produto ignorado', produtoId });
  if (!email) return json({ error: 'E-mail não encontrado no payload' }, 400);

  let linha: Record<string, unknown> | null = null;
  if (LIBERA.includes(evento)) {
    linha = { email, name: nome, active: true, source: 'hotmart', hotmart_transaction: transacao, expires_at: null, updated_at: new Date().toISOString() };
  } else if (BLOQUEIA.includes(evento)) {
    linha = { email, name: nome, active: false, source: 'hotmart', hotmart_transaction: transacao, updated_at: new Date().toISOString() };
  } else {
    return json({ message: 'Evento ignorado', evento });
  }

  const r = await fetch(`${base}/rest/v1/assinaturas_lipedema360?on_conflict=email`, {
    method: 'POST',
    headers: {
      ...cabecalhoServico(servico),
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(linha),
  });
  if (!r.ok) return json({ error: 'Falha ao gravar assinatura' }, 500);
  return json({ success: true, email, acesso: linha.active });
};

export const ALL: APIRoute = () => new Response(null, { status: 405 });
