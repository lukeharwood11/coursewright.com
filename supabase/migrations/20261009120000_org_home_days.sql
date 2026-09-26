-- Org home days (weekdays students learn at home; optional, may be empty).

create or replace function private.home_days_valid(days smallint[])
returns boolean
language sql
immutable
as $$
  select
    days is not null
    and cardinality(days) between 0 and 7
    and days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
    and cardinality(days) = (select count(distinct d) from unnest(days) as d);
$$;

alter table public.organizations
  add column home_days smallint[] not null default '{}';

alter table public.organizations
  add constraint organizations_home_days_chk
    check (private.home_days_valid(home_days));

comment on column public.organizations.home_days is
  'Weekdays students learn at home; 0=Sunday … 6=Saturday (JS Date.getDay()). Empty when unset.';
