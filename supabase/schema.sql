-- Operation Eats schema
-- Run this once in the Supabase SQL editor:
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
  role text not null default '',
  skills text[] not null default '{}'::text[]
);

create table if not exists applications (
  id text primary key,
  person_id text not null references people(id) on delete cascade,
  platform_id text not null references platforms(id) on delete cascade,
  status text not null default 'applied' check (status in ('applied', 'accepted', 'rejected')),
  date text not null default ''
);

create table if not exists deliveries (
  id text primary key,
  person_id text not null references people(id) on delete cascade,
  platform_id text not null references platforms(id) on delete cascade,
  date text not null default '',
  restaurant text not null default '',
  collection text not null default '',
  notes text not null default '',
  time_period text not null default '',
  busyness text not null default '',
  area text not null default ''
);

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
