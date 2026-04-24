-- Operation Eats schema
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/qqthlojwzlpgocubndci/sql/new

-- ============================================================
-- Tables
-- ============================================================

create table if not exists skills (
  name text primary key
);

create table if not exists people (
  id text primary key,
  name text not null,
  skills text[] not null default '{}'::text[]
);

create table if not exists platforms (
  id text primary key,
  name text not null,
  variant text not null default '',
  vehicle_source text not null default '',
  skills text[] not null default '{}'::text[],
  application_notes text not null default '',
  general_notes text not null default '',
  process_steps jsonb not null default '[]'::jsonb
);

create table if not exists applications (
  id text primary key,
  person_id text not null references people(id) on delete cascade,
  platform_id text not null references platforms(id) on delete cascade,
  status text not null default 'applied' check (status in ('should_apply','applying','applied','background_check','accepted','rejected')),
  date text not null default ''
);

create table if not exists deliveries (
  id text primary key,
  person_id text references people(id) on delete cascade,
  account_owner_id text references people(id) on delete set null,
  platform_id text references platforms(id) on delete cascade,
  date text not null default '',
  restaurant text not null default '',
  collection text not null default '',
  handover text not null default '',
  notes text not null default '',
  handover2 text not null default '',
  notes2 text not null default '',
  extra_orders jsonb not null default '[]'::jsonb,
  start_time text not null default '',
  end_time text not null default '',
  busyness text not null default '',
  area text not null default ''
);

-- ============================================================
-- Migrations for existing databases (idempotent)
-- ============================================================

alter table platforms add column if not exists variant text not null default '';
alter table platforms add column if not exists vehicle_source text not null default '';
alter table platforms add column if not exists application_notes text not null default '';
alter table platforms add column if not exists general_notes text not null default '';
alter table platforms add column if not exists process_steps jsonb not null default '[]'::jsonb;

alter table deliveries add column if not exists account_owner_id text references people(id) on delete set null;
alter table deliveries add column if not exists handover text not null default '';
alter table deliveries add column if not exists start_time text not null default '';
alter table deliveries add column if not exists end_time text not null default '';
alter table deliveries add column if not exists handover2 text not null default '';
alter table deliveries add column if not exists notes2 text not null default '';
alter table deliveries add column if not exists extra_orders jsonb not null default '[]'::jsonb;
alter table deliveries alter column person_id drop not null;
alter table deliveries alter column platform_id drop not null;

-- ============================================================
-- Disable RLS — shared data, no auth
-- ============================================================

alter table skills disable row level security;
alter table people disable row level security;
alter table platforms disable row level security;
alter table applications disable row level security;
alter table deliveries disable row level security;

-- ============================================================
-- Seed the default skills list (idempotent)
-- ============================================================

insert into skills (name) values
  ('driving licence'),
  ('car'),
  ('bike'),
  ('e-bike'),
  ('moped'),
  ('motorcycle'),
  ('right to work'),
  ('english'),
  ('smartphone'),
  ('18+'),
  ('dbs check'),
  ('food hygiene')
on conflict (name) do nothing;
