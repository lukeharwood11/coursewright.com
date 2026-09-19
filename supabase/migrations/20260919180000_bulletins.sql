-- Course bulletins: dated notices with attached materials (FEATURES P0).
-- Availability is the start_date–end_date window. Soft-delete only.
-- HN-014: apply this migration on the testing (and later production) database.

create table public.bulletins (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  course_id bigint not null references public.courses (id) on delete cascade,
  title text not null,
  body text not null default '',
  start_date date not null,
  end_date date not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id),
  constraint bulletins_title_chk check (char_length(btrim(title)) > 0),
  constraint bulletins_date_range_chk check (end_date >= start_date)
);

create index bulletins_organization_id_idx on public.bulletins (organization_id);
create index bulletins_course_id_idx on public.bulletins (course_id)
  where deleted_at is null;
create index bulletins_course_dates_idx
  on public.bulletins (course_id, start_date, end_date)
  where deleted_at is null;
create index bulletins_created_by_idx on public.bulletins (created_by);

create trigger bulletins_set_updated_at
before update on public.bulletins
for each row execute function private.set_updated_at();

comment on table public.bulletins is 'SCHEMA.md Bulletin — dated course notice';
comment on column public.bulletins.start_date is
  'First local calendar day families see this bulletin (inclusive)';
comment on column public.bulletins.end_date is
  'Last local calendar day families see this bulletin (inclusive)';

create table public.bulletin_materials (
  id bigserial primary key,
  bulletin_id bigint not null references public.bulletins (id) on delete cascade,
  material_id bigint not null references public.materials (id) on delete cascade,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint bulletin_materials_bulletin_material_key unique (bulletin_id, material_id)
);

create index bulletin_materials_bulletin_id_idx
  on public.bulletin_materials (bulletin_id, position);
create index bulletin_materials_material_id_idx
  on public.bulletin_materials (material_id);

comment on table public.bulletin_materials is
  'SCHEMA.md BulletinMaterial — materials listed under a bulletin';

create or replace function private.bulletin_material_same_course()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  bulletin_course bigint;
  material_course bigint;
begin
  select b.course_id into bulletin_course
  from public.bulletins b
  where b.id = new.bulletin_id;

  select m.course_id into material_course
  from public.materials m
  where m.id = new.material_id;

  if bulletin_course is null or material_course is null
     or bulletin_course is distinct from material_course then
    raise exception 'Those materials need to be in the same course as this bulletin.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger bulletin_materials_same_course
before insert or update on public.bulletin_materials
for each row execute function private.bulletin_material_same_course();

alter table public.bulletins enable row level security;
alter table public.bulletin_materials enable row level security;

revoke all on table public.bulletins from anon, authenticated;
revoke all on table public.bulletin_materials from anon, authenticated;

grant select, insert, update on table public.bulletins to authenticated;
grant select, insert, update, delete on table public.bulletin_materials to authenticated;
grant select, insert, update, delete on table public.bulletins to service_role;
grant select, insert, update, delete on table public.bulletin_materials to service_role;

create policy bulletins_select on public.bulletins
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (
    deleted_at is null
    and (select private.parent_can_view_course(course_id))
  )
);

create policy bulletins_insert on public.bulletins
for insert to authenticated
with check (
  (select private.can_manage_course(course_id))
  and created_by = (select auth.uid())
);

create policy bulletins_update on public.bulletins
for update to authenticated
using ((select private.can_manage_course(course_id)))
with check ((select private.can_manage_course(course_id)));

create policy bulletin_materials_select on public.bulletin_materials
for select to authenticated
using (
  exists (
    select 1
    from public.bulletins b
    where b.id = bulletin_id
      and (
        (select private.is_org_staff(b.organization_id))
        or (
          b.deleted_at is null
          and (select private.parent_can_view_course(b.course_id))
        )
      )
  )
);

create policy bulletin_materials_insert on public.bulletin_materials
for insert to authenticated
with check (
  exists (
    select 1
    from public.bulletins b
    where b.id = bulletin_id
      and b.deleted_at is null
      and (select private.can_manage_course(b.course_id))
  )
);

create policy bulletin_materials_update on public.bulletin_materials
for update to authenticated
using (
  exists (
    select 1
    from public.bulletins b
    where b.id = bulletin_id
      and (select private.can_manage_course(b.course_id))
  )
)
with check (
  exists (
    select 1
    from public.bulletins b
    where b.id = bulletin_id
      and (select private.can_manage_course(b.course_id))
  )
);

create policy bulletin_materials_delete on public.bulletin_materials
for delete to authenticated
using (
  exists (
    select 1
    from public.bulletins b
    where b.id = bulletin_id
      and (select private.can_manage_course(b.course_id))
  )
);
