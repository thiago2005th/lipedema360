import { artigos, tituloExibido, resumoCurto, TIPOS } from '../lib/data';

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function GET() {
  const site = 'https://lipedema360.com.br';
  const itens = artigos.slice(0, 50).map((a) => `
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
  <title>Lipedema360</title>
  <link>${site}</link>
  <description>A ciência do lipedema, atualizada todo dia.</description>
  <language>pt-BR</language>${itens}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
