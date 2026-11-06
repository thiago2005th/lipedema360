# Lipedema360 · continuar daqui

Última sessão: 6 nov 2026, no computador do consultório. O Thiago vai continuar no notebook de casa.

## Para o Claude (leia antes de qualquer coisa)

O Thiago não programa. Ele conversa, você executa e explica em linguagem simples.
Contexto completo do projeto em `LEIA-ME.md`.

### Estado em 6 nov 2026

- Base de artigos: 801 artigos do PubMed em `data/articles.json`. Robô `pipeline/fetch_pubmed.py` funcionando.
- Site Astro em `site/` compila (821 páginas). Para rodar localmente: `cd site && npm install && npm run build && npm run preview`.
  **No notebook de casa é preciso rodar `npm install` dentro de `site/` antes** (a pasta `node_modules` foi removida de propósito para não sincronizar pelo Dropbox).
- Git: repositório **https://github.com/thiago2005th/lipedema360** (público), branch `main`, tudo commitado.
  No notebook de casa o Git vai pedir login do GitHub no primeiro `git push`: rodar o push pelo painel de terminal do app (não pelo Bash), que a janela de login abre no navegador. Usuário GitHub: **thiago2005th**.
- Vercel: conta logada no Chrome como thiago2005th (time "thiago2005th-2180s-projects", plano Hobby).
  O repositório foi importado em vercel.com/new com Root Directory = `site`, preset Astro, mas o Deploy **parou numa verificação por e-mail** (código de 6 dígitos para thiago2005th@gmail.com) que não foi concluída.
  **Próximo passo:** abrir https://vercel.com/new, verificar se já existe um projeto "lipedema360" no painel (https://vercel.com/dashboard). Se não existir, importar de novo (Root Directory `site`, preset Astro) e fazer o Deploy; o Thiago digita o código do e-mail.
- Domínio lipedema360.com.br: registrado no Registro.br, com Google Workspace (e-mail). Ainda não apontado para a Vercel.
- Chave da API da Anthropic: ainda não criada. Sem ela o site mostra os abstracts em inglês.

### Próximos passos, na ordem

1. Concluir o Deploy na Vercel (ver acima). Conferir o site na URL `*.vercel.app`.
2. Na Vercel, Settings > Domains, adicionar `lipedema360.com.br` e `www.lipedema360.com.br`. Copiar os registros DNS que ela mostrar.
3. No Registro.br (o Thiago entra na conta), editar a zona DNS: adicionar o registro A (apex) e o CNAME (www) da Vercel. **Não apagar os registros MX/TXT do Google Workspace.**
4. Criar a chave da API em https://console.anthropic.com (o Thiago cria e coloca crédito; a chave não deve ser colada no chat). Salvar no GitHub em Settings > Secrets and variables > Actions > New repository secret, nome `ANTHROPIC_API_KEY`.
5. Rodar manualmente o workflow "Atualizar artigos" na aba Actions do GitHub para gerar os primeiros resumos em português, e conferir no site.
6. Fase 2: área grátis x premium (login + pagamento), newsletter semanal, páginas temáticas estilo Examine.com.

### Decisões já tomadas (não reabrir)

- Fonte única PubMed via E-utilities; AIHOT (do PDF do curso) descartado por exigir Docker/Postgres/servidor.
- Site estático Astro + Vercel gratuito + GitHub Actions diário às 06:00 de Brasília.
- Resumos em português com modelo `claude-sonnet-5-5` (barato), só para artigos com abstract.
