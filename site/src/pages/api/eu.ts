import type { APIRoute } from 'astro';
import { verificar } from '../../lib/acesso';

export const prerender = false;

// Diz à página se o visitante é assinante ativo (usa o mesmo cookie e a mesma regra das ferramentas).
export const GET: APIRoute = async ({ cookies }) => {
  const v = await verificar(cookies.get('l360_at')?.value);
  const corpo = v.ok ? { ok: true, email: v.email } : { ok: false, motivo: v.motivo };
  return new Response(JSON.stringify(corpo), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });
};
