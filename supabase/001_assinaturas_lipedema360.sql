-- ============================================================
-- LIPEDEMA360 — Assinaturas Profissionais
-- Rodar UMA vez em: Supabase > SQL Editor > New Query > Run
-- (pode ser o mesmo projeto do PONTE Analyzer: a tabela é separada)
-- ============================================================

create table if not exists assinaturas_lipedema360 (
  email text primary key check (email = lower(email)),
  name text,
  active boolean not null default true,
  plan text not null default 'profissional',          -- 'profissional' | 'clinica' | ...
  source text not null default 'manual',              -- 'manual' | 'hotmart'
  hotmart_transaction text,
  expires_at timestamptz,                             -- NULL = sem data de término
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table assinaturas_lipedema360 enable row level security;

-- O usuário logado só enxerga a PRÓPRIA linha (pelo e-mail do login).
drop policy if exists "assinante le a propria linha" on assinaturas_lipedema360;
create policy "assinante le a propria linha"
  on assinaturas_lipedema360 for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Nenhuma regra de insert/update/delete para usuários: só o servidor (webhook, service role) grava.

-- Liberar alguém à mão (teste, cortesia, mentorados):
--   insert into assinaturas_lipedema360 (email, name, source, plan)
--   values ('pessoa@email.com', 'Nome', 'manual', 'profissional')
--   on conflict (email) do update set active = true, expires_at = null;
-- Bloquear:
--   update assinaturas_lipedema360 set active = false where email = 'pessoa@email.com';
