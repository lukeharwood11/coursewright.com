-- Lesson plans replace bulletins (FEATURES P0). HN-014: apply on testing (and later production).
-- Weekly Sunday–Saturday plans with publish controls and per-day materials.

drop policy if exists bulletin_materials_delete on public.bulletin_materials;
drop policy if exists bulletin_materials_update on public.bulletin_materials;
drop policy if exists bulletin_materials_insert on public.bulletin_materials;
drop policy if exists bulletin_materials_select on public.bulletin_materials;
drop policy if exists bulletins_update on public.bulletins;
drop policy if exists bulletins_insert on public.bulletins;
drop policy if exists bulletins_select on public.bulletins;

drop trigger if exists bulletin_materials_same_course on public.bulletin_materials;
drop trigger if exists bulletins_set_updated_at on public.bulletins;

drop function if exists private.bulletin_material_same_course();

drop table if exists public.bulletin_materials;
drop table if exists public.bulletins;

alter table public.courses
  add column if not exists color_key text;

update public.courses
set color_key = (array[
  'moss', 'slate', 'clay', 'plum', 'sea', 'wine', 'sand', 'pine'
])[1 + ((id - 1) % 8)]
where color_key is null;

alter table public.courses
  alter column color_key set default 'moss';

alter table public.courses
  alter column color_key set not null;

alter table public.courses
  drop constraint if exists courses_color_key_chk;

alter table public.courses
  add constraint courses_color_key_chk
  check (color_key in (
    'moss', 'slate', 'clay', 'plum', 'sea', 'wine', 'sand', 'pine'
  ));

comment on column public.courses.color_key is
  'SCHEMA.md Course.color_key — calendar / legend color';

create table public.lesson_plans (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  course_id bigint not null references public.courses (id) on delete cascade,
  week_start date not null,
  title text not null,
  week_note text not null default '',
  visibility text not null default 'unpublished',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id),
  constraint lesson_plans_title_chk check (char_length(btrim(title)) > 0),
  constraint lesson_plans_visibility_chk check (visibility in ('published', 'unpublished')),
  constraint lesson_plans_week_start_sunday_chk check (extract(dow from week_start) = 0)
);

create unique index lesson_plans_course_week_uidx
  on public.lesson_plans (course_id, week_start)
  where deleted_at is null;

create index lesson_plans_organization_id_idx on public.lesson_plans (organization_id);
create index lesson_plans_course_id_idx on public.lesson_plans (course_id)
  where deleted_at is null;
create index lesson_plans_created_by_idx on public.lesson_plans (created_by);

create trigger lesson_plans_set_updated_at
before update on public.lesson_plans
for each row execute function private.set_updated_at();

comment on table public.lesson_plans is
  'SCHEMA.md LessonPlan — weekly course plan; published / unpublished';
comment on column public.lesson_plans.week_start is
  'Sunday of the Sunday–Saturday week this plan covers';

create table public.lesson_plan_days (
  id bigserial primary key,
  lesson_plan_id bigint not null references public.lesson_plans (id) on delete cascade,
  day_date date not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_plan_days_plan_day_key unique (lesson_plan_id, day_date)
);

create index lesson_plan_days_lesson_plan_id_idx
  on public.lesson_plan_days (lesson_plan_id, day_date);

create trigger lesson_plan_days_set_updated_at
before update on public.lesson_plan_days
for each row execute function private.set_updated_at();

comment on table public.lesson_plan_days is
  'SCHEMA.md LessonPlanDay — optional note for one day in a lesson plan';

create or replace function private.lesson_plan_day_in_week()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  plan_start date;
begin
  select lp.week_start into plan_start
  from public.lesson_plans lp
  where lp.id = new.lesson_plan_id;

  if plan_start is null
     or new.day_date < plan_start
     or new.day_date > (plan_start + 6) then
    raise exception 'That day needs to be in the same week as this lesson plan.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger lesson_plan_days_in_week
before insert or update on public.lesson_plan_days
for each row execute function private.lesson_plan_day_in_week();

create table public.lesson_plan_day_materials (
  id bigserial primary key,
  lesson_plan_day_id bigint not null references public.lesson_plan_days (id) on delete cascade,
  material_id bigint not null references public.materials (id) on delete cascade,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint lesson_plan_day_materials_day_material_key
    unique (lesson_plan_day_id, material_id)
);

create index lesson_plan_day_materials_day_id_idx
  on public.lesson_plan_day_materials (lesson_plan_day_id, position);
create index lesson_plan_day_materials_material_id_idx
  on public.lesson_plan_day_materials (material_id);

comment on table public.lesson_plan_day_materials is
  'SCHEMA.md LessonPlanDayMaterial — materials listed under a lesson-plan day';

create or replace function private.lesson_plan_day_material_same_course()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  plan_course bigint;
  material_course bigint;
begin
  select lp.course_id into plan_course
  from public.lesson_plan_days d
  join public.lesson_plans lp on lp.id = d.lesson_plan_id
  where d.id = new.lesson_plan_day_id;

  select m.course_id into material_course
  from public.materials m
  where m.id = new.material_id;

  if plan_course is null or material_course is null
     or plan_course is distinct from material_course then
    raise exception 'Those materials need to be in the same course as this lesson plan.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger lesson_plan_day_materials_same_course
before insert or update on public.lesson_plan_day_materials
for each row execute function private.lesson_plan_day_material_same_course();

alter table public.lesson_plans enable row level security;
alter table public.lesson_plan_days enable row level security;
alter table public.lesson_plan_day_materials enable row level security;

revoke all on table public.lesson_plans from anon, authenticated;
revoke all on table public.lesson_plan_days from anon, authenticated;
revoke all on table public.lesson_plan_day_materials from anon, authenticated;

grant select, insert, update on table public.lesson_plans to authenticated;
grant select, insert, update, delete on table public.lesson_plan_days to authenticated;
grant select, insert, update, delete on table public.lesson_plan_day_materials to authenticated;
grant select, insert, update, delete on table public.lesson_plans to service_role;
grant select, insert, update, delete on table public.lesson_plan_days to service_role;
grant select, insert, update, delete on table public.lesson_plan_day_materials to service_role;

create policy lesson_plans_select on public.lesson_plans
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (
    deleted_at is null
    and visibility = 'published'
    and (select private.parent_can_view_course(course_id))
  )
);

create policy lesson_plans_insert on public.lesson_plans
for insert to authenticated
with check (
  (select private.can_manage_course(course_id))
  and created_by = (select auth.uid())
);

create policy lesson_plans_update on public.lesson_plans
for update to authenticated
using ((select private.can_manage_course(course_id)))
with check ((select private.can_manage_course(course_id)));

create policy lesson_plan_days_select on public.lesson_plan_days
for select to authenticated
using (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and (
        (select private.is_org_staff(lp.organization_id))
        or (
          lp.deleted_at is null
          and lp.visibility = 'published'
          and (select private.parent_can_view_course(lp.course_id))
        )
      )
  )
);

create policy lesson_plan_days_insert on public.lesson_plan_days
for insert to authenticated
with check (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and lp.deleted_at is null
      and (select private.can_manage_course(lp.course_id))
  )
);

create policy lesson_plan_days_update on public.lesson_plan_days
for update to authenticated
using (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and (select private.can_manage_course(lp.course_id))
  )
)
with check (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and (select private.can_manage_course(lp.course_id))
  )
);

create policy lesson_plan_days_delete on public.lesson_plan_days
for delete to authenticated
using (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and (select private.can_manage_course(lp.course_id))
  )
);

create policy lesson_plan_day_materials_select on public.lesson_plan_day_materials
for select to authenticated
using (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and (
        (select private.is_org_staff(lp.organization_id))
        or (
          lp.deleted_at is null
          and lp.visibility = 'published'
          and (select private.parent_can_view_course(lp.course_id))
        )
      )
  )
);

create policy lesson_plan_day_materials_insert on public.lesson_plan_day_materials
for insert to authenticated
with check (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and lp.deleted_at is null
      and (select private.can_manage_course(lp.course_id))
  )
);

create policy lesson_plan_day_materials_update on public.lesson_plan_day_materials
for update to authenticated
using (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and (select private.can_manage_course(lp.course_id))
  )
)
with check (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and (select private.can_manage_course(lp.course_id))
  )
);

create policy lesson_plan_day_materials_delete on public.lesson_plan_day_materials
for delete to authenticated
using (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and (select private.can_manage_course(lp.course_id))
  )
);
