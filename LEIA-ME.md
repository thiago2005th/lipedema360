# Lipedema360 · guia do Thiago

Site: **lipedema360.com.br** · Boletim científico sobre lipedema que se atualiza sozinho.

## O que tem aqui

| Pasta | O que é |
|---|---|
| `pipeline/fetch_pubmed.py` | Robô que busca no PubMed todos os artigos sobre lipedema e classifica por área e tipo de evidência. Não precisa de chave. |
| `pipeline/summarize.py` | Gera título, resumo, pontos-chave e relevância clínica em português usando o Claude. Precisa de uma chave da API da Anthropic. |
| `data/articles.json` | A base de artigos (hoje: 801). É o "banco de dados" do site. |
| `site/` | O site, feito em Astro. Lê a base e gera páginas estáticas: home, boletim semanal, melhor evidência, áreas, página por artigo, RSS. |
| `.github/workflows/atualizar.yml` | Agenda diária: roda o robô, gera resumos e publica. |

## Como ver o site no seu computador

Abra o Claude Code nesta pasta e peça: "roda o site do lipedema360". Ou no terminal:

```
cd site
npm run build
npm run preview
```

e abra http://localhost:4321.

## Como atualizar os artigos manualmente

```
python pipeline/fetch_pubmed.py
```

## Como colocar no ar (ordem recomendada)

1. **Conta no GitHub** (github.com, gratuita). O código e a base ficam lá. O Claude sobe os arquivos para você.
2. **Conta na Vercel** (vercel.com, gratuita) conectada ao GitHub. Ela publica o site sozinha a cada atualização. Configuração: pasta raiz `site`, comando `npm run build`.
3. **Domínio**: no Registro.br, apontar `lipedema360.com.br` para a Vercel (ela mostra os registros DNS a copiar).
4. **Chave da API da Anthropic** (console.anthropic.com) para os resumos em português. Guardar como "secret" `ANTHROPIC_API_KEY` no GitHub. Custo estimado: centavos por artigo; cerca de 4 artigos novos por semana.

## Fases seguintes (planejadas)

- **Fase 2, área grátis x premium**: login (Supabase ou Clerk), pagamento (Stripe ou Hotmart), conteúdo premium: resumos completos, análise crítica, boletim por e-mail, busca avançada.
- **Fase 3**: newsletter semanal automática, páginas temáticas tipo Examine.com (ex.: "Dieta cetogênica no lipedema: o que a evidência diz"), alertas por área.
