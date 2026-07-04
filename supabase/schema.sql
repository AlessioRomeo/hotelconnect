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
  -- Reception-set: guest still in the room. Keeps it hidden from cleaning until
  -- reception clears it. (Distinct from do_not_disturb, which cleaners set.)
  guest_in_room boolean not null default false,
  -- Reception-set: the room has breakfast, and for how many guests. Shown to the
  -- breakfast staff so they can plan quantities.
  breakfast   boolean not null default false,
  breakfast_guests integer
              check (breakfast_guests is null or breakfast_guests between 1 and 20),
  note        text,
  updated_at  timestamptz not null default now(),
  updated_by  text check (updated_by in ('reception', 'pulizie')),
  sort_order  integer not null default 0,
  unique (room_group, name)
);

-- Added after initial release; safe to re-run for existing projects.
alter table public.rooms add column if not exists guest_in_room boolean not null default false;
alter table public.rooms add column if not exists breakfast boolean not null default false;
alter table public.rooms add column if not exists breakfast_guests integer
  check (breakfast_guests is null or breakfast_guests between 1 and 20);

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
  created_by  text check (created_by in ('reception', 'pulizie', 'colazione', 'admin')),
  resolved_at timestamptz,
  resolved_by text check (resolved_by in ('reception', 'pulizie', 'colazione', 'admin'))
);

-- Widened after initial release (notes are shared by all four roles now); safe
-- to re-run for existing projects.
alter table public.notes drop constraint if exists notes_created_by_check;
alter table public.notes add constraint notes_created_by_check
  check (created_by in ('reception', 'pulizie', 'colazione', 'admin'));
alter table public.notes drop constraint if exists notes_resolved_by_check;
alter table public.notes add constraint notes_resolved_by_check
  check (resolved_by in ('reception', 'pulizie', 'colazione', 'admin'));

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

-- Fixed catalog of purchasable breakfast items. The hotel always buys the same
-- things, so the shopping list UI is built from this table instead of free text.
-- Seeded from seed.sql.
create table if not exists public.catalog_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  category    text not null,
  sort_order  integer not null default 0,
  active      boolean not null default true
);

-- The shopping list ("lista della spesa"). One pending row per catalog item
-- (quantity is edited in place); purchased rows are kept for history until
-- cleared. "Purchased" is derived from purchased_at being set, like notes.
create table if not exists public.shopping_items (
  id               uuid primary key default gen_random_uuid(),
  catalog_item_id  uuid not null references public.catalog_items(id) on delete cascade,
  quantity         integer not null default 1 check (quantity >= 1),
  comment          text,
  created_at       timestamptz not null default now(),
  created_by       text check (created_by in ('reception', 'pulizie', 'colazione', 'admin')),
  purchased_at     timestamptz,
  purchased_by     text check (purchased_by in ('reception', 'pulizie', 'colazione', 'admin'))
);

create unique index if not exists shopping_items_pending_unique
  on public.shopping_items (catalog_item_id)
  where purchased_at is null;

-- RLS: catalog is read-only from the app; the list is fully managed by any
-- authenticated session, mirroring the notes policies.
alter table public.catalog_items enable row level security;

drop policy if exists "authenticated can read catalog" on public.catalog_items;
create policy "authenticated can read catalog"
  on public.catalog_items
  for select
  to authenticated
  using (true);

alter table public.shopping_items enable row level security;

drop policy if exists "authenticated can read shopping" on public.shopping_items;
create policy "authenticated can read shopping"
  on public.shopping_items
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated can insert shopping" on public.shopping_items;
create policy "authenticated can insert shopping"
  on public.shopping_items
  for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated can update shopping" on public.shopping_items;
create policy "authenticated can update shopping"
  on public.shopping_items
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can delete shopping" on public.shopping_items;
create policy "authenticated can delete shopping"
  on public.shopping_items
  for delete
  to authenticated
  using (true);

-- Realtime for the shopping list (the catalog is static, no realtime needed).
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shopping_items'
  ) then
    alter publication supabase_realtime add table public.shopping_items;
  end if;
end;
$$;
