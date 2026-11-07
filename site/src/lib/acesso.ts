// Verificação de acesso Profissional, SEMPRE no servidor.
// Regra: na dúvida, nega. Sem configuração, sem login, sem assinatura ou com erro de rede = sem acesso.

export type Motivo = 'sem-login' | 'sessao' | 'sem-assinatura' | 'expirada' | 'config' | 'erro';
export type Veredito = { ok: true; email: string } | { ok: false; motivo: Motivo };

export function env(nome: string): string | undefined {
  const p = typeof process !== 'undefined' ? process.env?.[nome] : undefined;
  return p || (import.meta.env as Record<string, string | undefined>)[nome];
}

export function configSupabase() {
  const url = (env('PUBLIC_SUPABASE_URL') || '').replace(/\/$/, '');
  const anon = env('PUBLIC_SUPABASE_ANON_KEY') || '';
  return url && anon ? { url, anon } : null;
}

export async function verificar(token?: string): Promise<Veredito> {
  const cfg = configSupabase();
  if (!cfg) return { ok: false, motivo: 'config' };
  if (!token) return { ok: false, motivo: 'sem-login' };
  try {
    const cab = { apikey: cfg.anon, Authorization: `Bearer ${token}` };

    // 1. O token é válido? (o Supabase confere a assinatura e a validade)
    const u = await fetch(`${cfg.url}/auth/v1/user`, { headers: cab });
    if (!u.ok) return { ok: false, motivo: 'sessao' };
    const user = await u.json();
    const email = String(user?.email || '').toLowerCase().trim();
    if (!email || !user?.email_confirmed_at) return { ok: false, motivo: 'sessao' };

    // 2. Esse e-mail tem assinatura ativa? (a regra RLS só deixa o usuário ver a própria linha)
    const r = await fetch(
      `${cfg.url}/rest/v1/assinaturas_lipedema360?select=active,expires_at&email=eq.${encodeURIComponent(email)}&limit=1`,
      { headers: cab },
    );
    if (!r.ok) return { ok: false, motivo: 'erro' };
    const linhas = await r.json();
    const a = Array.isArray(linhas) ? linhas[0] : null;
    if (!a || a.active !== true) return { ok: false, motivo: 'sem-assinatura' };
    if (a.expires_at && new Date(a.expires_at).getTime() < Date.now()) return { ok: false, motivo: 'expirada' };
    return { ok: true, email };
  } catch {
    return { ok: false, motivo: 'erro' };
  }
}
