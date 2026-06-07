-- HotelConnect schema. Run in the Supabase dashboard SQL editor. Safe to re-run.

-- "room_group" (not "group") because GROUP is a reserved SQL keyword.
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  room_group  text not null check (room_group in ('hotel', 'bnb', 'sala')),
  status      text not null default 'pulita'
              check (status in ('pulita', 'da_pulire', 'in_pulizia')),
  urgent      boolean not null default false,
  service_type text
              check (service_type is null or service_type in ('fermata', 'partenza')),
  do_not_disturb boolean not null default false,
  note        text,
  updated_at  timestamptz not null default now(),
  updated_by  text check (updated_by in ('reception', 'pulizie')),
  sort_order  integer not null default 0,
  unique (room_group, name)
);

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

-- RLS: only authenticated sessions can read/update; INSERT/DELETE not granted.
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

-- Realtime: broadcast row changes to all connected clients.
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

-- Notes / segnalazioni: free-standing notes ("Lampadina fulminata", "Lavandino
-- rotto", ...) that persist regardless of any room's status. Optionally tied to a
-- room. Resolved notes are kept (not deleted) for tracking; "resolved" is derived
-- from resolved_at being set (no separate boolean).
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  room_id     uuid references public.rooms(id) on delete set null,
  created_at  timestamptz not null default now(),
  created_by  text check (created_by in ('reception', 'pulizie')),
  resolved_at timestamptz,
  resolved_by text check (resolved_by in ('reception', 'pulizie'))
);

-- RLS: any authenticated session (either role) can read and manage notes; the
-- UI is identical for both roles. Mirrors the "both roles authenticated" approach
-- used for rooms.
alter table public.notes enable row level security;

drop policy if exists "authenticated can read notes" on public.notes;
create policy "authenticated can read notes"
  on public.notes
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated can insert notes" on public.notes;
create policy "authenticated can insert notes"
  on public.notes
  for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated can update notes" on public.notes;
create policy "authenticated can update notes"
  on public.notes
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can delete notes" on public.notes;
create policy "authenticated can delete notes"
  on public.notes
  for delete
  to authenticated
  using (true);

-- Realtime for notes too.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notes'
  ) then
    alter publication supabase_realtime add table public.notes;
  end if;
end;
$$;
