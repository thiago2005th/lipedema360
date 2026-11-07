import { artigos, nivelEvidencia, tituloExibido, autoresCurto } from '../lib/data';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function GET() {
  const dados = artigos.map((a) => ({
    p: a.pmid,
    t: tituloExibido(a),
    o: a.titulo_pt ? a.titulo : '',
    a: a.area,
    y: a.tipo,
    d: a.data,
    r: a.revista,
    u: autoresCurto(a),
    e: nivelEvidencia(a),
    h: norm([a.titulo, a.titulo_pt || '', a.revista, a.autores.join(' '), a.keywords.join(' '), a.mesh.join(' ')].join(' ')),
  }));
  return new Response(JSON.stringify(dados), { headers: { 'Content-Type': 'application/json' } });
}
