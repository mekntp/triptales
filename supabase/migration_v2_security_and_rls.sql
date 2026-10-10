-- ====================================================================
-- TripTales Database Migration v2 — Security & Row Level Security (RLS)
-- Plan the trip. Capture the memories.
-- ====================================================================

-- 1. Safely add user_id and is_deleted columns to all tables
do $$
begin
  -- trips table
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trips' and column_name = 'user_id') then
    alter table public.trips add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trips' and column_name = 'is_deleted') then
    alter table public.trips add column is_deleted boolean not null default false;
  end if;

  -- places table
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'places' and column_name = 'user_id') then
    alter table public.places add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'places' and column_name = 'is_deleted') then
    alter table public.places add column is_deleted boolean not null default false;
  end if;

  -- photo_missions table
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'photo_missions' and column_name = 'user_id') then
    alter table public.photo_missions add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
  end if;

  -- photos table
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'photos' and column_name = 'user_id') then
    alter table public.photos add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'photos' and column_name = 'is_deleted') then
    alter table public.photos add column is_deleted boolean not null default false;
  end if;

  -- trip_journal table
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trip_journal' and column_name = 'user_id') then
    alter table public.trip_journal add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trip_journal' and column_name = 'is_deleted') then
    alter table public.trip_journal add column is_deleted boolean not null default false;
  end if;
end $$;

-- 2. Indexes for user-scoped queries
create index if not exists idx_trips_user on public.trips(user_id);
create index if not exists idx_places_user on public.places(user_id, trip_id);
create index if not exists idx_photo_missions_user on public.photo_missions(user_id, trip_id);
create index if not exists idx_photos_user on public.photos(user_id, trip_id);
create index if not exists idx_trip_journal_user on public.trip_journal(user_id, trip_id);

-- 3. Drop legacy open anonymous access policies
drop policy if exists "Allow anon all trips" on public.trips;
drop policy if exists "Allow anon all places" on public.places;
drop policy if exists "Allow anon all photo_missions" on public.photo_missions;
drop policy if exists "Allow anon all photos" on public.photos;
drop policy if exists "Allow anon all trip_journal" on public.trip_journal;

-- 4. Enable Row Level Security (RLS) on all tables
alter table public.trips enable row level security;
alter table public.places enable row level security;
alter table public.photo_missions enable row level security;
alter table public.photos enable row level security;
alter table public.trip_journal enable row level security;

-- 5. Strict User Ownership RLS Policies

-- TRIPS
drop policy if exists "Users can view own trips" on public.trips;
create policy "Users can view own trips" on public.trips
  for select to authenticated
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can insert own trips" on public.trips;
create policy "Users can insert own trips" on public.trips
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own trips" on public.trips;
create policy "Users can update own trips" on public.trips
  for update to authenticated
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own trips" on public.trips;
create policy "Users can delete own trips" on public.trips
  for delete to authenticated
  using (auth.uid() = user_id);

-- PLACES
drop policy if exists "Users can view own places" on public.places;
create policy "Users can view own places" on public.places
  for select to authenticated
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can insert own places" on public.places;
create policy "Users can insert own places" on public.places
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own places" on public.places;
create policy "Users can update own places" on public.places
  for update to authenticated
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own places" on public.places;
create policy "Users can delete own places" on public.places
  for delete to authenticated
  using (auth.uid() = user_id);

-- PHOTO MISSIONS
drop policy if exists "Users can view own photo_missions" on public.photo_missions;
create policy "Users can view own photo_missions" on public.photo_missions
  for select to authenticated
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can insert own photo_missions" on public.photo_missions;
create policy "Users can insert own photo_missions" on public.photo_missions
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own photo_missions" on public.photo_missions;
create policy "Users can update own photo_missions" on public.photo_missions
  for update to authenticated
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own photo_missions" on public.photo_missions;
create policy "Users can delete own photo_missions" on public.photo_missions
  for delete to authenticated
  using (auth.uid() = user_id);

-- PHOTOS
drop policy if exists "Users can view own photos" on public.photos;
create policy "Users can view own photos" on public.photos
  for select to authenticated
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can insert own photos" on public.photos;
create policy "Users can insert own photos" on public.photos
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own photos" on public.photos;
create policy "Users can update own photos" on public.photos
  for update to authenticated
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own photos" on public.photos;
create policy "Users can delete own photos" on public.photos
  for delete to authenticated
  using (auth.uid() = user_id);

-- TRIP JOURNAL
drop policy if exists "Users can view own trip_journal" on public.trip_journal;
create policy "Users can view own trip_journal" on public.trip_journal
  for select to authenticated
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can insert own trip_journal" on public.trip_journal;
create policy "Users can insert own trip_journal" on public.trip_journal
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own trip_journal" on public.trip_journal;
create policy "Users can update own trip_journal" on public.trip_journal
  for update to authenticated
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own trip_journal" on public.trip_journal;
create policy "Users can delete own trip_journal" on public.trip_journal
  for delete to authenticated
  using (auth.uid() = user_id);

-- 6. Storage Security Policies for 'trip-photos' Bucket
-- Drop legacy wide-open storage policies
drop policy if exists "Allow public select trip-photos" on storage.objects;
drop policy if exists "Allow public insert trip-photos" on storage.objects;
drop policy if exists "Allow public update trip-photos" on storage.objects;
drop policy if exists "Allow public delete trip-photos" on storage.objects;

-- Allow public read so photos can render in trip albums and share cards
create policy "Allow read trip-photos"
  on storage.objects for select
  using (bucket_id = 'trip-photos');

-- Only authenticated users can upload photos, into their own user folder path: {auth.uid()}/*
create policy "Users can upload own photos in trip-photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'trip-photos' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Only object owner can update
create policy "Users can update own photos in trip-photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'trip-photos' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Only object owner can delete
create policy "Users can delete own photos in trip-photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'trip-photos' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
