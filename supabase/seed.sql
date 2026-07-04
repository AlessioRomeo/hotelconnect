-- Seed the rooms (run after schema.sql). Idempotent. 26 hotel + 7 B&B + Sala Riunioni.

insert into public.rooms (name, room_group, sort_order)
select g::text, 'hotel', g - 100
from generate_series(100, 122) as g
on conflict (room_group, name) do nothing;

insert into public.rooms (name, room_group, sort_order)
select g::text, 'hotel', g - 178
from generate_series(201, 203) as g
on conflict (room_group, name) do nothing;

insert into public.rooms (name, room_group, sort_order)
select g::text, 'bnb', g
from generate_series(1, 7) as g
on conflict (room_group, name) do nothing;

insert into public.rooms (name, room_group, sort_order)
values ('Sala Riunioni', 'sala', 1)
on conflict (room_group, name) do nothing;

-- Placeholder shopping catalog (to be replaced with the hotel's real list).
-- sort_order is global: the tens digit groups the category, so category order
-- is data-driven.
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
