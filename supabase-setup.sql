-- ==============================================================================
-- SUPABASE SETUP - MRJ CORRETOR BUILDER
-- ==============================================================================
-- Instruções:
-- 1. Acesse https://supabase.com e entre no seu projeto gratuito.
-- 2. No menu lateral esquerdo, clique no ícone "SQL Editor" (ícone de terminal/código).
-- 3. Clique em "+ New query", cole todo este código abaixo e clique no botão verde "Run".
-- ==============================================================================

-- 1. Criar a tabela para salvar os imóveis, fotos e dados do site
create table if not exists mrj_site_data (
  id integer primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar segurança em nível de linha (RLS)
alter table mrj_site_data enable row level security;

-- 3. Permitir que qualquer visitante leia os dados dos imóveis
drop policy if exists "Permitir leitura pública" on mrj_site_data;
create policy "Permitir leitura pública"
on mrj_site_data for select
to anon, authenticated
using (true);

-- 4. Permitir que o painel administrativo salve as atualizações
drop policy if exists "Permitir inserção pelo painel" on mrj_site_data;
create policy "Permitir inserção pelo painel"
on mrj_site_data for insert
to anon, authenticated
with check (true);

drop policy if exists "Permitir atualização pelo painel" on mrj_site_data;
create policy "Permitir atualização pelo painel"
on mrj_site_data for update
to anon, authenticated
using (true);

-- 5. Inserir registro inicial
insert into mrj_site_data (id, data, updated_at)
values (1, '{}'::jsonb, now())
on conflict (id) do nothing;

