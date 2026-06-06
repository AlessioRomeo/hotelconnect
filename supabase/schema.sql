-- ============================================================================
-- HotelConnect — database schema
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run (uses IF NOT EXISTS / idempotent guards where practical).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- rooms: the single table that does almost everything.
-- ----------------------------------------------------------------------------
-- Note: the column is named "room_group" (not "group") because GROUP is a
-- reserved SQL keyword and using it bare causes endless quoting headaches.
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                         -- label staff recognise: "101", "1"
  room_group  text not null check (room_group in ('hotel', 'bnb')),
  status      text not null default 'pulita'
              check (status in ('pulita', 'da_pulire', 'in_pulizia')),
  urgent      boolean not null default false,        -- meaningful only when da_pulire
  note        text,                                  -- optional short free text
  updated_at  timestamptz not null default now(),
  updated_by  text check (updated_by in ('reception', 'pulizie')),  -- last role to change it
  sort_order  integer not null default 0,            -- stable display order within a group
  -- a room name is unique within its group (hotel "1" and bnb "1" could coexist)
  unique (room_group, name)
);

-- ----------------------------------------------------------------------------
-- Keep updated_at fresh automatically on every UPDATE, so the client can never
-- forget to bump it. (updated_by is still set by the client.)
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security: only an authenticated session (someone who signed in via
-- the PIN -> hidden role account) can read or change rooms. The anon public key
-- alone gives NO access.
--
-- First version: both authenticated roles can read and update. The difference
-- in what reception vs pulizie can do is enforced in the UI. (Role-specific DB
-- permissions are deliberately deferred — see the brief.)
-- INSERT/DELETE are intentionally NOT granted: the room list is seeded once via
-- the SQL editor (service role) and never changes from the app.
-- ----------------------------------------------------------------------------
alter table public.rooms enable row level security;

drop policy if exists "authenticated can read rooms" on public.rooms;
create policy "authenticated can read rooms"
  on public.rooms
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated can update rooms" on public.rooms;
create policy "authenticated can update rooms"
  on public.rooms
  for update
  to authenticated
  using (true)
  with check (true);

-- ----------------------------------------------------------------------------
-- Realtime: broadcast row changes on rooms to all connected clients.
-- This is the heart of the app — without it, devices don't sync live.
-- (The supabase_realtime publication already exists on a fresh project.)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end;
$$;
