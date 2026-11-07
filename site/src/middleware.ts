import { defineMiddleware } from 'astro:middleware';
import { verificar, verificarAdmin } from './lib/acesso';

// Áreas que exigem assinatura Profissional. O índice /ferramentas continua público (vitrine).
function protegida(caminho: string) {
  return caminho.startsWith('/ferramentas/');
}
function admin(caminho: string) {
  return caminho === '/admin' || caminho.startsWith('/admin/');
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const caminho = ctx.url.pathname.replace(/\.html$/, '');
  const cab = { 'Cache-Control': 'private, no-store' };

  if (admin(caminho)) {
    const a = await verificarAdmin(ctx.cookies.get('l360_at')?.value);
    if (!a.ok) return new Response(null, { status: 302, headers: { Location: `/entrar?next=${encodeURIComponent(caminho)}&erro=sem-login`, ...cab } });
    const r = await next();
    r.headers.set('Cache-Control', 'private, no-store');
    r.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return r;
  }

  if (!protegida(caminho)) return next();

  const v = await verificar(ctx.cookies.get('l360_at')?.value);
  if (!v.ok) {
    const destino = `/entrar?next=${encodeURIComponent(caminho)}&erro=${v.motivo}`;
    return new Response(null, { status: 302, headers: { Location: destino, ...cab } });
  }

  const resposta = await next();
  resposta.headers.set('Cache-Control', 'private, no-store');
  resposta.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return resposta;
});
