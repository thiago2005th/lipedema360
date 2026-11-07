import { artigos, AREAS, TIPOS, tituloExibido, resumoCurto, nivelEvidencia } from '../../lib/data';

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function getStaticPaths() {
  return [{ params: { feed: 'alta-evidencia' } }, ...Object.keys(AREAS).map((feed) => ({ params: { feed } }))];
}

export function GET({ params }: { params: { feed: string } }) {
  const site = 'https://lipedema360.com.br';
  const feed = params.feed;
  const alta = feed === 'alta-evidencia';
  const lista = artigos.filter((a) => (alta ? nivelEvidencia(a) >= 4 : a.area === feed)).slice(0, 50);
  const titulo = alta ? 'Lipedema360 · Alta evidência' : `Lipedema360 · ${AREAS[feed]?.nome}`;
  const desc = alta ? 'Diretrizes, metanálises e ensaios clínicos randomizados sobre lipedema.' : AREAS[feed]?.desc || '';
  const itens = lista.map((a) => `
    <item>
      <title>${esc(tituloExibido(a))}</title>
      <link>${site}/artigos/${a.pmid}</link>
      <guid isPermaLink="true">${site}/artigos/${a.pmid}</guid>
      <pubDate>${new Date(a.data + 'T12:00:00Z').toUTCString()}</pubDate>
      <category>${esc(TIPOS[a.tipo] || a.tipo)}</category>
      <description>${esc(resumoCurto(a, 500))}</description>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${esc(titulo)}</title>
  <link>${site}/alertas</link>
  <description>${esc(desc)}</description>
  <language>pt-BR</language>${itens}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
