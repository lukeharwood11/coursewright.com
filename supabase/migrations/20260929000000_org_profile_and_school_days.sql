-- Org profile (about, location, website, contact) and school days (default Mon–Fri).

create or replace function private.school_days_valid(days smallint[])
returns boolean
language sql
immutable
as $$
  select
    days is not null
    and cardinality(days) between 1 and 7
    and days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
    and cardinality(days) = (select count(distinct d) from unnest(days) as d);
$$;

alter table public.organizations
  add column school_days smallint[] not null default '{1,2,3,4,5}',
  add column about text,
  add column address text,
  add column website text,
  add column contact_email text,
  add column phone text;

alter table public.organizations
  add constraint organizations_school_days_chk
    check (private.school_days_valid(school_days)),
  add constraint organizations_about_len_chk
    check (about is null or char_length(about) <= 4000),
  add constraint organizations_address_len_chk
    check (address is null or char_length(address) <= 500),
  add constraint organizations_website_len_chk
    check (website is null or char_length(website) <= 200),
  add constraint organizations_contact_email_len_chk
    check (contact_email is null or char_length(contact_email) <= 200),
  add constraint organizations_phone_len_chk
    check (phone is null or char_length(phone) <= 200);

comment on column public.organizations.school_days is
  'Weekdays the org operates; 0=Sunday … 6=Saturday (JS Date.getDay()). Default Mon–Fri.';
comment on column public.organizations.about is
  'Optional in-app about text shown on org home.';
comment on column public.organizations.address is
  'Optional free-text location / mailing address.';
comment on column public.organizations.website is
  'Optional external website URL.';
comment on column public.organizations.contact_email is
  'Optional org-facing inbox (not a login email).';
comment on column public.organizations.phone is
  'Optional org phone, free text.';
