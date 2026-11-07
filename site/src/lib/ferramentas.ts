export type Fonte = { ref: string; nota?: string; busca?: string };

export type Ferramenta = {
  slug: string;
  nome: string;
  categoria: 'Diagnóstico' | 'Tratamento' | 'Seguimento' | 'Consulta';
  resumo: string;
  palavras: string[]; // termos para achar estudos novos relacionados na base
};

export const CATEGORIAS: Record<string, string> = {
  Diagnóstico: 'Do primeiro atendimento à hipótese diagnóstica.',
  Tratamento: 'Decisão terapêutica estruturada.',
  Seguimento: 'Medir, comparar e acompanhar a evolução.',
  Consulta: 'Transformar tudo em documento.',
};

export const FERRAMENTAS: Ferramenta[] = [
  { slug: 'criterios-diagnosticos', nome: 'Critérios diagnósticos', categoria: 'Diagnóstico', resumo: 'Checklist de história e exame físico com a regra de decisão publicada (Wold, Halk e Damstra).', palavras: ['diagnos', 'criteria', 'screening'] },
  { slug: 'classificacao', nome: 'Tipo e estágio', categoria: 'Diagnóstico', resumo: 'Classifique distribuição (tipos I a V) e gravidade (estágios 1 a 4) com a descrição de cada categoria.', palavras: ['stage', 'staging', 'classification', 'type'] },
  { slug: 'diferencial', nome: 'Diagnóstico diferencial', categoria: 'Diagnóstico', resumo: 'Marque os achados e compare com o perfil típico de lipedema, linfedema, obesidade, doença venosa e Dercum.', palavras: ['lymphedema', 'lymphoedema', 'differential', 'obesity', 'dercum'] },
  { slug: 'antropometria', nome: 'Antropometria', categoria: 'Diagnóstico', resumo: 'IMC, relação cintura-quadril, cintura-estatura e razão gordura de pernas/IMC (DXA) com os cortes da literatura.', palavras: ['dxa', 'body composition', 'waist', 'bmi', 'anthropometr'] },
  { slug: 'laudo-ultrassom', nome: 'Laudo de ultrassom', categoria: 'Diagnóstico', resumo: 'Espessura de derme e subcutâneo em quatro pontos padronizados, comparada aos cortes de Amato et al. (2021). Gera o laudo.', palavras: ['ultrasound', 'ultrasonography', 'sonograph'] },
  { slug: 'instrumentos', nome: 'Questionários e escalas', categoria: 'Diagnóstico', resumo: 'Instrumentos validados usados em lipedema, o que cada um mede e onde estão os estudos de validação.', palavras: ['questionnaire', 'quality of life', 'validity', 'reliability', 'scale'] },
  { slug: 'plano-terapeutico', nome: 'Plano terapêutico', categoria: 'Tratamento', resumo: 'Pilares do tratamento conservador e critérios para considerar cirurgia, com o nível de evidência de cada um.', palavras: ['treatment', 'therapy', 'liposuction', 'compression', 'ketogenic', 'diet', 'exercise'] },
  { slug: 'seguimento', nome: 'Seguimento de medidas', categoria: 'Seguimento', resumo: 'Registre peso, dor e circunferências a cada visita, veja a evolução e calcule o volume dos membros.', palavras: ['follow-up', 'outcome', 'circumference', 'volume', 'pain'] },
  { slug: 'nota-consulta', nome: 'Nota de consulta', categoria: 'Consulta', resumo: 'Reúne o que você registrou nas ferramentas e monta o texto pronto para o prontuário.', palavras: [] },
];

export const AVISO =
  'Ferramenta de apoio à decisão clínica. Não substitui o julgamento do profissional nem o exame do paciente. O que você digita só é gravado se você escolher um paciente e clicar em “Salvar avaliação”; sem isso, fica apenas na tela. Os dados gravados ficam no seu cadastro e só você os vê.';
