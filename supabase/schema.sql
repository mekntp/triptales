-- ====================================================================
-- Supabase Schema for Dad & Son Phitsanulok 2026 Web App
-- Project: xjqpfmcgxvvsnvyjxrac
-- ====================================================================

-- 1. Create table for photo missions
create table if not exists public.photo_missions (
  id bigint generated always as identity primary key,
  mission_id int not null unique,
  stars int not null default 0 check (stars >= 0 and stars <= 3),
  completed boolean not null default false,
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Index for fast lookup by mission_id
create index if not exists idx_photo_missions_mission_id on public.photo_missions (mission_id);

-- 3. Enable Row Level Security (RLS)
alter table public.photo_missions enable row level security;

-- 4. Drop existing policies if they exist (to prevent duplicates on re-run)
drop policy if exists "Allow anon read photo_missions" on public.photo_missions;
drop policy if exists "Allow anon insert photo_missions" on public.photo_missions;
drop policy if exists "Allow anon update photo_missions" on public.photo_missions;

-- 5. Allow public read & write for this family trip app
create policy "Allow anon read photo_missions"
  on public.photo_missions for select
  to anon, authenticated
  using (true);

create policy "Allow anon insert photo_missions"
  on public.photo_missions for insert
  to anon, authenticated
  with check (true);

create policy "Allow anon update photo_missions"
  on public.photo_missions for update
  to anon, authenticated
  using (true)
  with check (true);
