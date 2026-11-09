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

// Link do formulário da lista de espera Premium (Google Forms, Tally etc.). Vazio = mostra "em breve".
export const LISTA_ESPERA_URL = '';
// Checkout da assinatura Profissional no Stripe (Payment Links). Preenchido = botões de assinar.
export const CHECKOUT_URL = 'https://buy.stripe.com/eVq00c7DV9oh7bvcCZ4AU00'; // mensal R$ 97,00
export const CHECKOUT_URL_ANUAL = 'https://buy.stripe.com/8x2aEQgarasl7bvcCZ4AU01'; // anual R$ 897,00

// Nível de evidência de 1 a 5, estimado pelo TIPO de publicação (não avalia a qualidade do estudo).
const NIVEIS: Record<string, number> = { guideline: 5, meta: 5, rct: 4, ensaio: 3, observacional: 3, revisao: 2, caso: 1, carta: 1 };
export function nivelEvidencia(a: Artigo): number {
  return NIVEIS[a.tipo] ?? 1;
}

export function citacaoVancouver(a: Artigo): string {
  const aut = a.autores.length > 6 ? a.autores.slice(0, 6).join(', ') + ', et al' : a.autores.join(', ');
  const ano = a.data.slice(0, 4);
  return `${aut}. ${a.titulo.replace(/\.$/, '')}. ${a.revista}. ${ano}.${a.doi ? ` doi:${a.doi}.` : ''} PMID: ${a.pmid}.`;
}

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
