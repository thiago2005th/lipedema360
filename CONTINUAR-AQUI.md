# Lipedema360 · continuar daqui

Última atualização: 7 nov 2026.

## Para o Claude (leia antes de qualquer coisa)

O Thiago não programa. Ele conversa, você executa e explica em linguagem simples.
Contexto geral em `LEIA-ME.md`. Nunca peça nem aceite chaves/senhas coladas no chat: o Thiago cola direto na Vercel/GitHub/Supabase.

### Estado em 7 nov 2026

- **Site no ar**: https://www.lipedema360.com.br (DNS no Registro.br: A `@` e CNAME `www` apontando para a Vercel). Branch `main` na Vercel, Root Directory `site`.
- **Base**: 802 artigos do PubMed (`data/articles.json`), 658 com resumo em português. O workflow "Atualizar artigos" roda todo dia 06:00 (Brasília) e resume 60/dia; pela aba Actions dá para rodar manualmente com outro limite. Chave `ANTHROPIC_API_KEY` já está nos Secrets do GitHub (o Secret antigo `ANTROPIC_API_KEY`, sem o "h", pode ser apagado).
- **Design**: editorial escuro, capa interativa (constelação de estudos), busca em português, comparar estudos, alertas RSS por área, página Profissional (`/premium`), análises críticas de exemplo (`/analises`, escritas a partir do abstract, a revisar pelo Dr. Thiago).
- **Ferramentas clínicas** (`/ferramentas/*`): critérios diagnósticos, tipo/estágio, diferencial, antropometria, laudo de ultrassom (cortes de Amato 2021), questionários, plano terapêutico, seguimento e nota de consulta. Fontes: Buso 2019, Amato 2021 e as revisões de dieta cetogênica da pasta `Artigos/Lipedema` do Dropbox.

### Área Profissional protegida (branch `acesso-profissional`, AINDA NÃO no ar)

Tudo abaixo está testado localmente com Supabase simulado e numa prévia da Vercel, **mas não com o Supabase real**.

- Adaptador `@astrojs/vercel@8` (compatível com Astro 5). Só as ferramentas, `/admin` e `/api/hotmart` rodam no servidor; o resto continua estático.
- `src/middleware.ts`: `/ferramentas/*` exige login + assinatura ativa (verificados no servidor); `/admin` exige e-mail em `ADMIN_EMAILS`. Nega por padrão (sem configuração = bloqueado).
- Login por link no e-mail (Supabase) em `/entrar`.
- **Pacientes e histórico**: o profissional cadastra o paciente com nome completo (+ prontuário e ano de nascimento opcionais); o sistema gera um código `L360-XXXXXXXX`. Salva avaliações por ferramenta, vê o histórico e compara com avaliações anteriores. Dados em `pacientes` e `avaliacoes` (RLS: cada profissional só vê os próprios; o banco também exige assinatura ativa).
- **Painel do dono** (`/admin`): só agregados anonimizados (células com menos de 5 casos aparecem como "<5"). O dono não vê nome nem prontuário. A visão SQL `v_avaliacoes_anonimas` só é acessível à service role.
- `/termos`: **rascunho** de termos e privacidade, precisa de advogado (LGPD).
- Webhook Hotmart `/api/hotmart`: libera na compra, bloqueia em reembolso/chargeback/cancelamento; só vale para os IDs em `HOTMART_PRODUCT_IDS`.

### O que falta para ligar (passos do Thiago)

1. Supabase (pode ser o mesmo projeto do PONTE): rodar `supabase/001_assinaturas_lipedema360.sql` e depois `supabase/002_pacientes_avaliacoes.sql` no SQL Editor. Liberar um teste: ver comentário no fim do 001.
2. Supabase > Authentication > URL Configuration: incluir `https://www.lipedema360.com.br/entrar`. Configurar SMTP próprio (o padrão do Supabase envia pouquíssimos e-mails por hora).
3. Vercel > Settings > Environment Variables (Production e Preview): `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (públicas), `SUPABASE_SERVICE_ROLE_KEY`, `HOTMART_WEBHOOK_SECRET`, `HOTMART_PRODUCT_IDS`, `ADMIN_EMAILS` (segredos colados pelo próprio Thiago). Depois, novo deploy.
4. Hotmart: criar o produto e um webhook novo apontando para `https://www.lipedema360.com.br/api/hotmart` (token = `HOTMART_WEBHOOK_SECRET`).
5. Juntar a branch `acesso-profissional` na `main` quando o Thiago aprovar (a `main` recebe commits automáticos do robô diário: fazer `git pull --rebase` antes).
6. Testar com Supabase real: login por link, compra de teste, salvar paciente, isolamento entre dois profissionais (rodar o teste no fim do 002), `/admin`.

### Pendências e cuidados

- **Jurídico/LGPD**: termos e política são rascunho. O uso dos dados é para melhorar o produto, de forma agregada/anonimizada. Qualquer uso para pesquisa científica exige base legal própria, consentimento e aprovação de comitê de ética (CEP). O nome do paciente fica na tabela `pacientes`, mas é o dono do banco (Supabase) quem tecnicamente consegue ler: endurecimento possível = criptografar o nome.
- Valores de preço/plano não definidos; lista de espera da página Profissional usa `LISTA_ESPERA_URL` em `site/src/lib/data.ts` (vazio = "em breve").
- O app de ultrassom próprio do Thiago não foi encontrado nos arquivos: o laudo foi montado pelo artigo de Amato 2021. Se o app dele usa outra lógica, adaptar.
- Build local pode falhar ao apagar `dist` (Dropbox/preview travando). Parar o preview e tentar de novo; na Vercel não acontece. `astro preview` não funciona com o adaptador da Vercel: testar com `astro dev`.

### Decisões já tomadas (não reabrir)

- Fonte única PubMed via E-utilities; site Astro + Vercel + GitHub Actions diário.
- Resumos em português com `claude-sonnet-5-5`.
- Público: profissionais de saúde. Visual: editorial clínico escuro.
- Acesso pago: login por link (sem senha), assinatura via Hotmart, verificação no servidor.
- Paciente: o profissional vê o nome completo; o dono do produto nunca precisa ver, só dados anonimizados.
