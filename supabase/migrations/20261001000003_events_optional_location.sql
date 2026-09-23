-- Location is optional on events (blank allowed; still max 200 characters).

alter table public.events
  drop constraint if exists events_location_chk;

alter table public.events
  add constraint events_location_chk check (char_length(location) <= 200);

comment on table public.events is
  'SCHEMA.md Event — one course, several classes, or the whole organization; optional location';
