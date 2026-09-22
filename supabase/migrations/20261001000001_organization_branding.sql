-- Owner-set icon and accent for organization chrome.
-- Kept off organizations: organizations_update allows any admin to update that row.

create table public.organization_branding (
  organization_id bigint primary key references public.organizations (id) on delete cascade,
  accent_color text,
  icon_path text,
  updated_at timestamptz not null default now(),
  constraint organization_branding_accent_chk check (
    accent_color is null or accent_color ~ '^#[0-9a-f]{6}$'
  ),
  constraint organization_branding_icon_path_chk check (
    icon_path is null
    or icon_path ~ ('^' || organization_id::text || '/icon\.(png|jpg|webp)$')
  )
);

comment on table public.organization_branding is
  'SCHEMA.md OrganizationBranding — owner-set icon and accent for org chrome';

create or replace function private.normalize_organization_branding()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.accent_color is not null then
    new.accent_color := lower(btrim(new.accent_color));
  end if;
  return new;
end;
$$;

create trigger organization_branding_normalize
before insert or update on public.organization_branding
for each row execute function private.normalize_organization_branding();

create trigger organization_branding_set_updated_at
before update on public.organization_branding
for each row execute function private.set_updated_at();

alter table public.organization_branding enable row level security;

revoke all on table public.organization_branding from anon, authenticated;
grant select, insert, update, delete on table public.organization_branding to authenticated;
grant select, insert, update, delete on table public.organization_branding to service_role;

create policy organization_branding_select on public.organization_branding
for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy organization_branding_insert on public.organization_branding
for insert to authenticated
with check ((select private.is_org_owner(organization_id)));

create policy organization_branding_update on public.organization_branding
for update to authenticated
using ((select private.is_org_owner(organization_id)))
with check ((select private.is_org_owner(organization_id)));

create policy organization_branding_delete on public.organization_branding
for delete to authenticated
using ((select private.is_org_owner(organization_id)));

-- Public so sidebar and account lists can use a normal image URL.
-- Writes stay owner-only. Path is {organization_id}/icon.{png|jpg|webp}.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-brand',
  'org-brand',
  true,
  262144,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy org_brand_select on storage.objects
for select to anon, authenticated
using (bucket_id = 'org-brand');

create policy org_brand_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'org-brand'
  and name ~ '^[0-9]+/icon\.(png|jpg|webp)$'
  and (select private.is_org_owner(
    case
      when split_part(name, '/', 1) ~ '^[0-9]+$' then split_part(name, '/', 1)::bigint
      else null
    end
  ))
);

create policy org_brand_update on storage.objects
for update to authenticated
using (
  bucket_id = 'org-brand'
  and (select private.is_org_owner(
    case
      when split_part(name, '/', 1) ~ '^[0-9]+$' then split_part(name, '/', 1)::bigint
      else null
    end
  ))
)
with check (
  bucket_id = 'org-brand'
  and name ~ '^[0-9]+/icon\.(png|jpg|webp)$'
  and (select private.is_org_owner(
    case
      when split_part(name, '/', 1) ~ '^[0-9]+$' then split_part(name, '/', 1)::bigint
      else null
    end
  ))
);

create policy org_brand_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'org-brand'
  and (select private.is_org_owner(
    case
      when split_part(name, '/', 1) ~ '^[0-9]+$' then split_part(name, '/', 1)::bigint
      else null
    end
  ))
);
