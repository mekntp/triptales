-- ====================================================================
-- TripTales Database Migration & Schema
-- Plan the trip. Capture the memories.
-- ====================================================================

-- 1. Trips Table
create table if not exists public.trips (
  id text primary key,
  name text not null,
  subtitle text,
  description text,
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Places / Itinerary Table
create table if not exists public.places (
  id text primary key,
  trip_id text references public.trips(id) on delete cascade,
  sort_order int not null default 1,
  icon text not null default '📍',
  name text not null,
  subtitle text,
  description text,
  tags text[] default '{}',
  maps_url text,
  latitude double precision,
  longitude double precision,
  duration_minutes int default 30,
  status text not null default 'planned' check (status in ('planned', 'visited', 'skipped')),
  is_favorite_for_kids boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Photo Missions Table
create table if not exists public.photo_missions (
  id bigint generated always as identity primary key,
  trip_id text references public.trips(id) on delete cascade,
  mission_id int not null,
  place_id text references public.places(id) on delete set null,
  title text not null,
  hint text,
  stars int not null default 0 check (stars >= 0 and stars <= 3),
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, mission_id)
);

-- 4. Photos Table (Multiple photos per mission)
create table if not exists public.photos (
  id text primary key default gen_random_uuid()::text,
  mission_id int not null,
  trip_id text references public.trips(id) on delete cascade,
  storage_path text not null,
  public_url text,
  created_at timestamptz not null default now()
);

-- 5. Trip Daily Journal Table
create table if not exists public.trip_journal (
  id text primary key default gen_random_uuid()::text,
  trip_id text references public.trips(id) on delete cascade,
  date date not null,
  note text not null,
  mood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, date)
);

-- Indexes for performance
create index if not exists idx_places_trip_order on public.places(trip_id, sort_order);
create index if not exists idx_photo_missions_trip on public.photo_missions(trip_id, mission_id);
create index if not exists idx_photos_mission on public.photos(mission_id);
create index if not exists idx_trip_journal_date on public.trip_journal(trip_id, date);

-- Enable Row Level Security (RLS)
alter table public.trips enable row level security;
alter table public.places enable row level security;
alter table public.photo_missions enable row level security;
alter table public.photos enable row level security;
alter table public.trip_journal enable row level security;

-- Public / Anon access policies for family travel app
drop policy if exists "Allow anon all trips" on public.trips;
create policy "Allow anon all trips" on public.trips
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow anon all places" on public.places;
create policy "Allow anon all places" on public.places
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow anon all photo_missions" on public.photo_missions;
create policy "Allow anon all photo_missions" on public.photo_missions
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow anon all photos" on public.photos;
create policy "Allow anon all photos" on public.photos
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow anon all trip_journal" on public.trip_journal;
create policy "Allow anon all trip_journal" on public.trip_journal
  for all to anon, authenticated using (true) with check (true);

-- Storage bucket setup for 'trip-photos'
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do update set public = true;

-- Storage bucket policies
drop policy if exists "Allow public select trip-photos" on storage.objects;
create policy "Allow public select trip-photos"
  on storage.objects for select to public
  using (bucket_id = 'trip-photos');

drop policy if exists "Allow public insert trip-photos" on storage.objects;
create policy "Allow public insert trip-photos"
  on storage.objects for insert to public
  with check (bucket_id = 'trip-photos');

drop policy if exists "Allow public update trip-photos" on storage.objects;
create policy "Allow public update trip-photos"
  on storage.objects for update to public
  using (bucket_id = 'trip-photos');

drop policy if exists "Allow public delete trip-photos" on storage.objects;
create policy "Allow public delete trip-photos"
  on storage.objects for delete to public
  using (bucket_id = 'trip-photos');
