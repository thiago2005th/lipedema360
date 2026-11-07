-- ============================================================
-- LIPEDEMA360 — Pacientes e avaliações do profissional
-- Rodar DEPOIS do 001, UMA vez, em: Supabase > SQL Editor > New Query > Run
-- ============================================================
-- Modelo de privacidade:
--  * Cada profissional só enxerga os PRÓPRIOS pacientes e avaliações (RLS).
--  * O nome completo fica só na tabela "pacientes". As avaliações guardam apenas o id do paciente.
--  * O dono do produto usa a VIEW anonimizada (sem nome, sem prontuário, sem profissional
--    identificado, data só por mês, sem textos livres). A view NÃO é acessível a usuários logados.
--  * Defesa em profundidade: além do login, o banco exige assinatura ativa para ler/gravar.
-- ============================================================

-- Função: o usuário logado tem assinatura ativa? (SECURITY DEFINER: lê a tabela fechada por RLS)
create or replace function public.tem_assinatura()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.assinaturas_lipedema360 a
    where a.email = lower(auth.jwt() ->> 'email')
      and a.active
      and (a.expires_at is null or a.expires_at > now())
  );
$$;
revoke all on function public.tem_assinatura() from public, anon;
grant execute on function public.tem_assinatura() to authenticated;

-- Aceite dos termos pelo profissional
create table if not exists public.profissionais (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  email text,
  aceite_termos_em timestamptz,
  versao_termos text,
  criado_em timestamptz not null default now()
);
alter table public.profissionais enable row level security;
drop policy if exists "prof le o proprio" on public.profissionais;
drop policy if exists "prof grava o proprio" on public.profissionais;
drop policy if exists "prof atualiza o proprio" on public.profissionais;
create policy "prof le o proprio" on public.profissionais for select to authenticated
  using (user_id = auth.uid() and public.tem_assinatura());
create policy "prof grava o proprio" on public.profissionais for insert to authenticated
  with check (user_id = auth.uid() and public.tem_assinatura());
create policy "prof atualiza o proprio" on public.profissionais for update to authenticated
  using (user_id = auth.uid() and public.tem_assinatura())
  with check (user_id = auth.uid() and public.tem_assinatura());

-- Pacientes (nome completo só aqui)
create table if not exists public.pacientes (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  codigo text not null unique default ('L360-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  nome text not null check (char_length(btrim(nome)) between 2 and 200),
  prontuario text check (prontuario is null or char_length(prontuario) <= 60),
  ano_nascimento smallint check (ano_nascimento is null or ano_nascimento between 1900 and 2100),
  arquivado boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists pacientes_prof_nome_idx on public.pacientes (profissional_id, nome);
alter table public.pacientes enable row level security;
drop policy if exists "pacientes do proprio profissional" on public.pacientes;
create policy "pacientes do proprio profissional" on public.pacientes for all to authenticated
  using (profissional_id = auth.uid() and public.tem_assinatura())
  with check (profissional_id = auth.uid() and public.tem_assinatura());

-- Avaliações (uma por salvamento de ferramenta)
create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  profissional_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ferramenta text not null check (char_length(ferramenta) <= 60),
  data_avaliacao date not null default current_date,
  dados jsonb not null check (pg_column_size(dados) < 65536),
  criado_em timestamptz not null default now()
);
create index if not exists avaliacoes_pac_idx on public.avaliacoes (paciente_id, ferramenta, data_avaliacao desc);
alter table public.avaliacoes enable row level security;
drop policy if exists "avaliacoes do proprio profissional" on public.avaliacoes;
create policy "avaliacoes do proprio profissional" on public.avaliacoes for all to authenticated
  using (profissional_id = auth.uid() and public.tem_assinatura())
  with check (
    profissional_id = auth.uid() and public.tem_assinatura()
    and exists (select 1 from public.pacientes p where p.id = paciente_id and p.profissional_id = auth.uid())
  );

-- Visão anonimizada para o dono do produto (melhoria do produto).
-- Sem nome, sem prontuário, sem ano de nascimento exato, sem profissional identificado,
-- data só por mês e sem textos livres (obs, texto, notas).
create or replace view public.v_avaliacoes_anonimas as
select
  p.codigo                                        as paciente_codigo,
  substr(md5(a.profissional_id::text), 1, 8)      as profissional_ref,
  a.ferramenta,
  date_trunc('month', a.data_avaliacao)::date     as mes,
  case when p.ano_nascimento is null then null
       else (extract(year from now())::int - p.ano_nascimento) / 10 * 10 end as faixa_etaria_decada,
  (a.dados - 'obs' - 'texto' - 'notas')           as dados
from public.avaliacoes a
join public.pacientes p on p.id = a.paciente_id;

revoke all on public.v_avaliacoes_anonimas from public, anon, authenticated;
-- (só a service role e o painel SQL do Supabase conseguem consultar)

-- Testes de isolamento (rode no SQL Editor depois de ter 2 profissionais com pacientes):
--   1) Como o profissional A (via app), listar pacientes: deve ver só os dele.
--   2) select * from public.v_avaliacoes_anonimas limit 5;  -- sem nome, sem prontuário, sem texto livre.
