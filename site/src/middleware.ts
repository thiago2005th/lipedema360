import { defineMiddleware } from 'astro:middleware';
import { verificar } from './lib/acesso';

// Áreas que exigem assinatura Profissional. O índice /ferramentas continua público (vitrine).
function protegida(caminho: string) {
  return caminho.startsWith('/ferramentas/');
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const caminho = ctx.url.pathname.replace(/\.html$/, '');
  if (!protegida(caminho)) return next();

  const v = await verificar(ctx.cookies.get('l360_at')?.value);
  if (!v.ok) {
    const destino = `/entrar?next=${encodeURIComponent(caminho)}&erro=${v.motivo}`;
    return new Response(null, { status: 302, headers: { Location: destino, 'Cache-Control': 'private, no-store' } });
  }

  const resposta = await next();
  resposta.headers.set('Cache-Control', 'private, no-store');
  resposta.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return resposta;
});
