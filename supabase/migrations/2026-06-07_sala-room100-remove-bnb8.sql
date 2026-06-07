-- Migration (2026-06-07): add hotel 100, remove B&B 8, add the Sala Riunioni
-- group. Run once in the SQL editor; transactional and idempotent.
begin;

-- Allow the 'sala' group (inline CHECK is named rooms_room_group_check).
alter table public.rooms drop constraint if exists rooms_room_group_check;
alter table public.rooms
  add constraint rooms_room_group_check
  check (room_group in ('hotel', 'bnb', 'sala'));

insert into public.rooms (name, room_group, sort_order)
values ('100', 'hotel', 0)
on conflict (room_group, name) do nothing;

delete from public.rooms
where room_group = 'bnb' and name = '8';

insert into public.rooms (name, room_group, sort_order)
values ('Sala Riunioni', 'sala', 1)
on conflict (room_group, name) do nothing;

commit;
