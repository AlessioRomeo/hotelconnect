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
