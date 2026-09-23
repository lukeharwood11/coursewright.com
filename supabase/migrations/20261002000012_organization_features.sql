-- Owner-set feature toggles for organization chrome and product surfaces.
-- Kept off organizations: organizations_update allows any admin to update that row.

create table public.organization_features (
  organization_id bigint primary key references public.organizations (id) on delete cascade,
  discussions_enabled boolean not null default true,
  announcements_enabled boolean not null default true,
  resources_enabled boolean not null default true,
  lesson_plans_enabled boolean not null default true,
  events_enabled boolean not null default true,
  calendar_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.organization_features is
  'SCHEMA.md OrganizationFeatures — owner-set toggles for optional product surfaces';

comment on column public.organization_features.discussions_enabled is
  'When false, hide Discussions nav, routes, and compose entry points.';
comment on column public.organization_features.announcements_enabled is
  'When false, hide Announcements nav, routes, home cards, and compose entry points.';
comment on column public.organization_features.resources_enabled is
  'When false, hide Resources nav and routes.';
comment on column public.organization_features.lesson_plans_enabled is
  'When false, hide lesson-plan authoring, routes, and calendar/this-week plan content.';
comment on column public.organization_features.events_enabled is
  'When false, hide event authoring, routes, and calendar/this-week event chips.';
comment on column public.organization_features.calendar_enabled is
  'When false, hide the Calendar nav and calendar page.';

create trigger organization_features_set_updated_at
before update on public.organization_features
for each row execute function private.set_updated_at();

alter table public.organization_features enable row level security;

revoke all on table public.organization_features from anon, authenticated;
grant select, insert, update, delete on table public.organization_features to authenticated;
grant select, insert, update, delete on table public.organization_features to service_role;

create policy organization_features_select on public.organization_features
for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy organization_features_insert on public.organization_features
for insert to authenticated
with check ((select private.is_org_owner(organization_id)));

create policy organization_features_update on public.organization_features
for update to authenticated
using ((select private.is_org_owner(organization_id)))
with check ((select private.is_org_owner(organization_id)));

create policy organization_features_delete on public.organization_features
for delete to authenticated
using ((select private.is_org_owner(organization_id)));
