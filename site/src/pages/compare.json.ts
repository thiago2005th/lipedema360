import { artigos, tituloExibido, autoresCurto, nivelEvidencia, TIPOS, AREAS } from '../lib/data';

export function GET() {
  const dados = artigos.map((a) => ({
    p: a.pmid,
    t: tituloExibido(a),
    ty: TIPOS[a.tipo] || a.tipo,
    ar: AREAS[a.area]?.nome || a.area,
    e: nivelEvidencia(a),
    d: a.data,
    r: a.revista,
    au: a.autores.length > 4 ? a.autores.slice(0, 4).join(', ') + ' et al.' : a.autores.join(', '),
    pt: !!a.resumo_pt,
    rs: (a.resumo_pt || a.resumo_original || '').replace(/\s+/g, ' ').slice(0, 900),
    k: a.pontos_chave || [],
    doi: a.doi,
    url: a.url,
  }));
  return new Response(JSON.stringify(dados), { headers: { 'Content-Type': 'application/json' } });
}
