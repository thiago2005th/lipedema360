// Gráficos em SVG para os documentos de exemplo (versão de servidor).
// A versão que roda no navegador (laudos reais) está em public/doc.js e segue o mesmo desenho.

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

export type LinhaBarra = { rotulo: string; valor: number; corte: number; max?: number; un?: string };

export function barras(linhas: LinhaBarra[], W = 560): string {
  const rh = 38, top = 8, bx = 190, bw = W - bx - 110, h = top + linhas.length * rh + 8;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="100%" role="img" font-family="Instrument Sans,Segoe UI,Arial,sans-serif">`;
  linhas.forEach((l, i) => {
    const y = top + i * rh;
    const mx = l.max || Math.max(l.valor, l.corte) * 1.3 || 1;
    const vw = Math.max(2, Math.min(1, l.valor / mx) * bw);
    const cx = Math.min(1, l.corte / mx) * bw;
    const acima = l.valor >= l.corte;
    const un = l.un || '';
    s += `<text x="0" y="${y + 17}" font-size="12" fill="#333">${esc(l.rotulo)}</text>`;
    s += `<rect x="${bx}" y="${y + 6}" width="${bw}" height="14" rx="2" fill="#ece8e1"/>`;
    s += `<rect x="${bx}" y="${y + 6}" width="${vw}" height="14" rx="2" fill="${acima ? '#8a6d3b' : '#8c939b'}"/>`;
    s += `<line x1="${bx + cx}" x2="${bx + cx}" y1="${y + 1}" y2="${y + 25}" stroke="#1d1a16" stroke-width="2"/>`;
    s += `<text x="${bx + bw + 8}" y="${y + 14}" font-size="12" font-weight="600" fill="#1d1a16">${fmt(l.valor)}${un}</text>`;
    s += `<text x="${bx + bw + 8}" y="${y + 27}" font-size="10" fill="#6b645b">corte ${fmt(l.corte)}${un}</text>`;
  });
  return s + '</svg>';
}

export type SerieLinha = { nome: string; pontos: number[]; cor?: string };

// Evolução entre visitas: uma ou mais séries na mesma escala.
export function linhas(datas: string[], series: SerieLinha[], W = 560, H = 190, un = ''): string {
  const pl = 40, pr = 16, pt = 14, pb = 34;
  const todos = series.flatMap((s) => s.pontos);
  const mn = Math.floor(Math.min(...todos) - 1), mx = Math.ceil(Math.max(...todos) + 1);
  const X = (i: number) => pl + (datas.length === 1 ? 0 : (i * (W - pl - pr)) / (datas.length - 1));
  const Y = (v: number) => pt + (1 - (v - mn) / (mx - mn)) * (H - pt - pb);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" font-family="Instrument Sans,Segoe UI,Arial,sans-serif">`;
  for (let k = 0; k <= 3; k++) {
    const v = mn + ((mx - mn) * k) / 3;
    s += `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e6e1d8"/><text x="${pl - 6}" y="${Y(v) + 4}" font-size="10" text-anchor="end" fill="#6b645b">${fmt(v)}</text>`;
  }
  datas.forEach((d, i) => { s += `<text x="${X(i)}" y="${H - 12}" font-size="10" text-anchor="middle" fill="#6b645b">${esc(d)}</text>`; });
  const cores = ['#8a6d3b', '#3f5f73', '#7a4b5f'];
  series.forEach((sr, k) => {
    const c = sr.cor || cores[k % cores.length];
    s += `<path d="${sr.pontos.map((v, i) => `${i ? 'L' : 'M'}${X(i)},${Y(v)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="2"/>`;
    sr.pontos.forEach((v, i) => { s += `<circle cx="${X(i)}" cy="${Y(v)}" r="3.4" fill="${c}"/>`; });
    const u = sr.pontos.length - 1;
    s += `<text x="${X(u) - 4}" y="${Y(sr.pontos[u]) - 8}" font-size="10" text-anchor="end" fill="${c}" font-weight="600">${esc(sr.nome)} ${fmt(sr.pontos[u])}${un}</text>`;
  });
  return s + '</svg>';
}
