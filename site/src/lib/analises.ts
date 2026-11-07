export type Analise = {
  pmid: string;
  titulo: string; // título curto da análise
  pergunta: string;
  desenho: string[];
  resultado: string[];
  vieses: string[];
  aplicabilidade: string[];
  conduta: string;
  pendente: string[]; // o que precisa ser conferido no texto completo
  atualizada: string;
};

// ATENÇÃO: análises elaboradas a partir do abstract (texto completo não revisado).
// Devem ser revisadas e assinadas pelo Dr. Thiago Cabral antes de serem tratadas como produto final.
export const ANALISES: Analise[] = [
  {
    pmid: '42692034',
    titulo: 'Lipoaspiração supera o tratamento conservador na dor, com mais eventos adversos graves',
    pergunta:
      'Em mulheres com lipedema estágio I a III e dor persistente na perna, a lipoaspiração é superior ao tratamento conservador para reduzir a dor após 12 meses, com segurança aceitável?',
    desenho: [
      'Ensaio clínico randomizado multicêntrico, 11 centros na Alemanha.',
      'Mulheres com lipedema estágio I, II ou III e dor na perna de pelo menos 4 pontos em escala numérica de 0 a 10.',
      'Todas receberam tratamento conservador por até 7 meses e só então foram randomizadas (2:1) para lipoaspiração (n=278) ou continuação do conservador (n=132), estratificadas por estágio e centro.',
      'Avaliador mascarado (adesivos aplicados nas pernas de todas as pacientes). Desfecho primário: redução de pelo menos 2 pontos na dor autorrelatada aos 12 meses. Análise por intenção de tratar; avaliação ausente contada como falha.',
      'Registro NCT04272827. Financiamento: Federal Joint Committee (Alemanha). Seguimento de 36 meses em andamento.',
    ],
    resultado: [
      'Desfecho primário: 68% (190 de 278) no grupo lipoaspiração contra 8% (10 de 132) no conservador. Razão de chances 26,2 (IC 95% 13,1 a 52,5; p<0,0001).',
      'Qualidade de vida melhorou mais no grupo lipoaspiração.',
      'Eventos adversos: 47% (124 de 265) com lipoaspiração contra 21% (30 de 145) no conservador. Eventos graves: 8% (20 de 265) contra 3% (5 de 145).',
    ],
    vieses: [
      'Não é possível mascarar a paciente quanto a ter ou não sido operada. Com desfecho de dor autorrelatado, expectativa e efeito de intervenção cirúrgica podem inflar a diferença; o mascaramento do avaliador não resolve isso.',
      'O comparador é a continuação do tratamento conservador, não uma cirurgia simulada. O estudo responde a uma pergunta pragmática, não a de efeito específico da técnica.',
      'A randomização ocorreu depois de até 7 meses de tratamento conservador: a população é de pacientes que continuaram sintomáticas.',
      'Os denominadores de segurança (265 e 145) diferem dos de randomização (278 e 132); a análise de segurança incluiu todas as incluídas. Conferir no texto completo.',
      'Dados de etnia não foram coletados, o que limita a generalização. Durabilidade além de 12 meses ainda desconhecida.',
    ],
    aplicabilidade: [
      'Aplica-se a mulheres com lipedema estágio I a III, dor de pelo menos 4/10 e falha de tratamento conservador adequado, tratadas em centros com experiência.',
      'Não informa sobre pacientes sem dor relevante, estágio 4 (lipolinfedema), homens ou desfechos de volume e estética.',
    ],
    conduta:
      'O estudo sustenta a lipoaspiração como opção para dor persistente após tratamento conservador, com benefício grande em 12 meses. No consentimento, vale discutir que cerca de 1 em cada 13 operadas teve evento adverso grave no estudo, e que a durabilidade só será conhecida com o seguimento de 36 meses.',
    pendente: [
      'Técnica(s) de lipoaspiração utilizada(s) e protocolo do tratamento conservador.',
      'Natureza dos eventos adversos graves e sua definição.',
      'Resultados de qualidade de vida e desfechos secundários em números.',
    ],
    atualizada: '2026-11-07',
  },
  {
    pmid: '39173577',
    titulo: 'Técnicas de lipoaspiração em lipedema: melhora de sintomas, sem base para eleger uma técnica',
    pergunta:
      'A lipoaspiração melhora sintomas em lipedema e há diferença de eficácia e segurança entre lipoaspiração tumescente tradicional, assistida por energia e assistida por jato de água?',
    desenho: [
      'Metanálise de 10 artigos publicados entre 2003 e 2023, com busca em PubMed e apenas em inglês.',
      '2.542 procedimentos em 906 pacientes. Técnicas: tumescente tradicional (TTL, 2 estudos), assistida por energia (PAL, 5), assistida por jato de água (WAL, 1) e PAL combinada com WAL (2).',
      'Estatística descritiva e modelo de efeitos aleatórios para avaliar heterogeneidade.',
    ],
    resultado: [
      'Todas as técnicas combinadas melhoraram dor, equimoses, edema, tensão, sensibilidade à pressão, prejuízo estético e prejuízo geral (todos p<0,00001).',
      'WAL reduziu mais a tensão e o prejuízo geral, mas com heterogeneidade alta.',
      'Complicações: TTL 1,5%, PAL 4,0%, WAL 0% e PAL com WAL 2,3%.',
    ],
    vieses: [
      'Os estudos incluídos são séries de procedimentos; tudo indica que a maioria não tem grupo controle (confirmar no texto completo). Melhora de sintomas autorrelatados sem controle é sujeita a viés.',
      'A conclusão sobre WAL repousa em um único estudo exclusivo da técnica, com heterogeneidade alta. Não sustenta superioridade.',
      'Busca limitada ao PubMed e a artigos em inglês; possível viés de publicação.',
      'Comparar taxas de complicação entre técnicas, vindas de estudos diferentes, não é comparação direta.',
    ],
    aplicabilidade: [
      'Descreve o que se observa em séries de pacientes operadas, não o efeito comparado a não operar.',
      'Não permite escolher técnica por segurança ou eficácia.',
    ],
    conduta:
      'A metanálise mostra melhora consistente de sintomas após lipoaspiração, com taxas baixas de complicação nas séries, mas não serve para escolher entre técnicas. A pergunta de eficácia contra o tratamento conservador passa a ser respondida pelo ensaio randomizado alemão de 2026.',
    pendente: [
      'Quantos dos 10 estudos eram prospectivos e se algum tinha grupo controle.',
      'Definição de complicação em cada estudo.',
      'Tamanho dos efeitos (diferenças médias) além dos valores de p.',
    ],
    atualizada: '2026-11-07',
  },
];
