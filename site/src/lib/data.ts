import raw from '../../../data/articles.json';

export type Artigo = {
  pmid: string;
  titulo: string;
  titulo_pt?: string;
  resumo_original: string;
  resumo_pt?: string;
  pontos_chave?: string[];
  relevancia_clinica?: string;
  destaque?: boolean;
  autores: string[];
  revista: string;
  data: string;
  doi: string;
  pmcid: string;
  idioma: string;
  tipos_publicacao: string[];
  keywords: string[];
  mesh: string[];
  tipo: string;
  area: string;
  peso: number;
  url: string;
  coletado_em: string;
};

export const artigos: Artigo[] = (raw as Artigo[]).filter((a) => a.data);

export const AREAS: Record<string, { nome: string; curto: string; desc: string }> = {
  cirurgia: { nome: 'Cirurgia e lipoaspiração', curto: 'Cirurgia', desc: 'Lipoaspiração tumescente, WAL, PAL, desfechos e complicações.' },
  nutricao: { nome: 'Nutrição e metabolismo', curto: 'Nutrição', desc: 'Dieta, cetogênica, suplementos, agonistas de GLP-1 e metabolismo.' },
  fisioterapia: { nome: 'Tratamento conservador', curto: 'Conservador', desc: 'Compressão, drenagem linfática, exercício e reabilitação.' },
  diagnostico: { nome: 'Diagnóstico e imagem', curto: 'Diagnóstico', desc: 'Critérios, questionários, ultrassom, RM, DEXA e bioimpedância.' },
  genetica: { nome: 'Genética e fisiopatologia', curto: 'Fisiopatologia', desc: 'Genes, tecido adiposo, inflamação, hormônios e biomarcadores.' },
  psicossocial: { nome: 'Qualidade de vida e saúde mental', curto: 'Qualidade de vida', desc: 'Impacto psicossocial, depressão, imagem corporal e estigma.' },
  epidemiologia: { nome: 'Epidemiologia e clínica', curto: 'Epidemiologia', desc: 'Prevalência, coortes, comorbidades e diagnóstico diferencial.' },
};

export const TIPOS: Record<string, string> = {
  guideline: 'Diretriz / consenso',
  meta: 'Metanálise / revisão sistemática',
  rct: 'Ensaio clínico randomizado',
  ensaio: 'Ensaio clínico',
  observacional: 'Estudo original',
  revisao: 'Revisão',
  caso: 'Relato de caso',
  carta: 'Carta / editorial',
};

export function fmtData(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${d} ${meses[(m || 1) - 1]} ${y}`;
}

export function autoresCurto(a: Artigo): string {
  if (!a.autores.length) return '';
  if (a.autores.length <= 3) return a.autores.join(', ');
  return `${a.autores[0]} et al.`;
}

export function tituloExibido(a: Artigo): string {
  return a.titulo_pt || a.titulo;
}

export function resumoCurto(a: Artigo, n = 260): string {
  const t = (a.resumo_pt || a.resumo_original || '').replace(/^[A-Z ]+:\s*/gm, '').replace(/\s+/g, ' ');
  return t.length > n ? t.slice(0, n).replace(/\s\S*$/, '') + '…' : t;
}

export function semanaDe(iso: string): string {
  // chave de semana ISO: ano-Www
  const d = new Date(iso + 'T00:00:00Z');
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const ano = d.getUTCFullYear();
  const inicio = new Date(Date.UTC(ano, 0, 1));
  const semana = Math.ceil(((d.getTime() - inicio.getTime()) / 86400000 + 1) / 7);
  return `${ano}-W${String(semana).padStart(2, '0')}`;
}

export const ultimaAtualizacao = artigos.reduce((m, a) => (a.coletado_em > m ? a.coletado_em : m), '');
