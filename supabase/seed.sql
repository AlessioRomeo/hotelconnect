-- ============================================================================
-- HotelConnect — seed the room list (run AFTER schema.sql).
-- 25 hotel rooms (101-122, 201-203) + 8 B&B rooms (1-8) = 33 total.
-- Idempotent: re-running does nothing thanks to the (room_group, name) unique
-- constraint + ON CONFLICT.
--
-- NOTE: the exact hotel range (101-122) is still to be confirmed with the hotel.
-- If it changes, edit the generate_series bounds below and re-run.
-- ============================================================================

-- Hotel, first floor: 101..122  -> sort_order 1..22
insert into public.rooms (name, room_group, sort_order)
select g::text, 'hotel', g - 100
from generate_series(101, 122) as g
on conflict (room_group, name) do nothing;

-- Hotel, second floor: 201..203 -> sort_order 23..25
insert into public.rooms (name, room_group, sort_order)
select g::text, 'hotel', g - 178
from generate_series(201, 203) as g
on conflict (room_group, name) do nothing;

-- B&B: 1..8 -> sort_order 1..8
insert into public.rooms (name, room_group, sort_order)
select g::text, 'bnb', g
from generate_series(1, 8) as g
on conflict (room_group, name) do nothing;
