-- Colazione + lista della spesa + accesso titolare. Safe to re-run.
-- Adds: breakfast flags on rooms, the fixed shopping catalog, the shopping list,
-- and widens the notes role checks so colazione/admin can use notes too.

-- Reception marks which rooms have breakfast (and for how many guests) so the
-- breakfast staff can plan quantities.
alter table public.rooms add column if not exists breakfast boolean not null default false;
alter table public.rooms add column if not exists breakfast_guests integer
  check (breakfast_guests is null or breakfast_guests between 1 and 20);

-- Notes are shared by all four roles now.
alter table public.notes drop constraint if exists notes_created_by_check;
alter table public.notes add constraint notes_created_by_check
  check (created_by in ('reception', 'pulizie', 'colazione', 'admin'));
alter table public.notes drop constraint if exists notes_resolved_by_check;
alter table public.notes add constraint notes_resolved_by_check
  check (resolved_by in ('reception', 'pulizie', 'colazione', 'admin'));

-- Fixed catalog of purchasable breakfast items. The hotel always buys the same
-- things, so the list UI is built from this table instead of free text.
create table if not exists public.catalog_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  category    text not null,
  sort_order  integer not null default 0,
  active      boolean not null default true
);

-- The shopping list. One pending row per catalog item (quantity is edited in
-- place); purchased rows are kept for history until cleared.
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

-- Placeholder catalog (to be replaced with the hotel's real list). sort_order is
-- global: the tens digit groups the category, so category order is data-driven.
insert into public.catalog_items (name, category, sort_order) values
  ('Cornetti vuoti', 'Forno e dolci', 10),
  ('Cornetti alla crema', 'Forno e dolci', 11),
  ('Pane', 'Forno e dolci', 12),
  ('Fette biscottate', 'Forno e dolci', 13),
  ('Biscotti', 'Forno e dolci', 14),
  ('Crostatine', 'Forno e dolci', 15),
  ('Merendine', 'Forno e dolci', 16),
  ('Latte fresco intero', 'Latticini e uova', 20),
  ('Latte senza lattosio', 'Latticini e uova', 21),
  ('Burro', 'Latticini e uova', 22),
  ('Yogurt bianco', 'Latticini e uova', 23),
  ('Yogurt alla frutta', 'Latticini e uova', 24),
  ('Uova', 'Latticini e uova', 25),
  ('Formaggio a fette', 'Latticini e uova', 26),
  ('Prosciutto cotto', 'Salumi', 30),
  ('Prosciutto crudo', 'Salumi', 31),
  ('Salame', 'Salumi', 32),
  ('Succo d''arancia', 'Bevande', 40),
  ('Succo ACE', 'Bevande', 41),
  ('Succo di pesca', 'Bevande', 42),
  ('Caffè in grani', 'Bevande', 43),
  ('Tè in bustine', 'Bevande', 44),
  ('Camomilla', 'Bevande', 45),
  ('Cacao in polvere', 'Bevande', 46),
  ('Marmellata monodose', 'Marmellate e creme', 50),
  ('Miele monodose', 'Marmellate e creme', 51),
  ('Crema di nocciole monodose', 'Marmellate e creme', 52),
  ('Arance', 'Frutta', 60),
  ('Mele', 'Frutta', 61),
  ('Banane', 'Frutta', 62),
  ('Macedonia', 'Frutta', 63),
  ('Zucchero in bustine', 'Altro', 70),
  ('Dolcificante', 'Altro', 71),
  ('Cereali', 'Altro', 72),
  ('Tovaglioli', 'Altro', 73),
  ('Bicchieri di carta', 'Altro', 74)
on conflict (name) do nothing;
