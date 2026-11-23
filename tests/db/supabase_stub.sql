-- Minimal stand-in for the parts of Supabase that the migrations depend on, so the
-- schema and its security rules can be tested on plain PostgreSQL.
-- It reproduces the behaviour that matters for security:
--   • anon / authenticated / service_role roles (service_role bypasses RLS)
--   • Supabase's DEFAULT PRIVILEGES, which grant ALL on new public tables to
--     anon and authenticated — so migrations are tested against the real risk
--   • auth.users and auth.uid() reading the JWT `sub` claim

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;
