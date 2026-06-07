-- Migration (2026-06-07): add service_type and do_not_disturb columns.
-- Run once in the SQL editor; idempotent.
begin;

alter table public.rooms
  add column if not exists service_type text
    check (service_type is null or service_type in ('fermata', 'partenza'));

alter table public.rooms
  add column if not exists do_not_disturb boolean not null default false;

commit;
