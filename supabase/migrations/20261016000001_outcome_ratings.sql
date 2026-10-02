-- US-82: outcome rating matrix and package checkpoint.
-- fill_cycle_id stays nullable until fill cycles exist. A null cycle is the
-- working package for the course. Families read ratings only after that
-- package is submitted.
-- Placeholder: HN-021

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.course_outcome_ratings (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  course_id bigint not null references public.courses (id) on delete cascade,
  student_profile_id bigint not null references public.org_profiles (id) on delete cascade,
  fill_cycle_id bigint,
  outcome_id bigint not null references public.course_outcomes (id) on delete cascade,
  criterion_id bigint references public.course_outcome_criteria (id) on delete cascade,
  rating_option_id bigint references public.outcome_rating_options (id) on delete restrict,
  rated_by uuid references public.profiles (id) on delete set null,
  rated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index course_outcome_ratings_cell_key
  on public.course_outcome_ratings (
    course_id,
    student_profile_id,
    outcome_id,
    criterion_id,
    fill_cycle_id
  )
  nulls not distinct;

create index course_outcome_ratings_student_idx
  on public.course_outcome_ratings (student_profile_id, course_id);

comment on table public.course_outcome_ratings is
  'One pick per student per outcome or criterion. Null rating_option_id is unset. Null fill_cycle_id is the course working set until a fill cycle is attached.';

create table public.course_outcome_packages (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  course_id bigint not null references public.courses (id) on delete cascade,
  fill_cycle_id bigint,
  submitted_by uuid references public.profiles (id) on delete set null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index course_outcome_packages_scope_key
  on public.course_outcome_packages (course_id, fill_cycle_id)
  nulls not distinct;

comment on table public.course_outcome_packages is
  'Checkpoint that the teacher submitted outcomes for a course (and later a fill cycle). Gaps in the matrix are allowed. Families see ratings only after this row exists.';

-- ---------------------------------------------------------------------------
-- Align
-- ---------------------------------------------------------------------------

create or replace function private.course_outcome_ratings_align()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  course_org bigint;
  outcome_course bigint;
  criterion_outcome bigint;
  criterion_count integer;
  option_org bigint;
  student_org bigint;
  student_ok boolean;
begin
  select c.organization_id into course_org
  from public.courses c
  where c.id = new.course_id;
  if course_org is null then
    raise exception 'Course not found.'
      using errcode = '23503';
  end if;
  if new.organization_id is distinct from course_org then
    raise exception 'Rating organization must match the course.'
      using errcode = '23514';
  end if;

  select o.course_id into outcome_course
  from public.course_outcomes o
  where o.id = new.outcome_id;
  if outcome_course is distinct from new.course_id then
    raise exception 'Rating outcome must belong to the course.'
      using errcode = '23514';
  end if;

  select count(*) into criterion_count
  from public.course_outcome_criteria c
  where c.outcome_id = new.outcome_id;

  if criterion_count > 0 then
    if new.criterion_id is null then
      raise exception 'Rate each criterion when the outcome has criteria.'
        using errcode = '23514';
    end if;
    select c.outcome_id into criterion_outcome
    from public.course_outcome_criteria c
    where c.id = new.criterion_id;
    if criterion_outcome is distinct from new.outcome_id then
      raise exception 'Criterion must belong to the outcome.'
        using errcode = '23514';
    end if;
  elsif new.criterion_id is not null then
    raise exception 'Rate the outcome directly when it has no criteria.'
      using errcode = '23514';
  end if;

  if new.rating_option_id is not null then
    select o.organization_id into option_org
    from public.outcome_rating_options o
    where o.id = new.rating_option_id;
    if option_org is distinct from new.organization_id then
      raise exception 'Rating option must belong to the organization.'
        using errcode = '23514';
    end if;
  end if;

  select sp.organization_id, sp.counts_as_student
    into student_org, student_ok
  from public.org_profiles sp
  where sp.id = new.student_profile_id;
  if student_org is distinct from new.organization_id or student_ok is not true then
    raise exception 'Rating student must be a student in this organization.'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.enrollments e
    where e.course_id = new.course_id
      and e.student_profile_id = new.student_profile_id
  ) then
    raise exception 'Rating student must be enrolled in the course.'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    if new.organization_id is distinct from old.organization_id
       or new.course_id is distinct from old.course_id
       or new.student_profile_id is distinct from old.student_profile_id
       or new.fill_cycle_id is distinct from old.fill_cycle_id
       or new.outcome_id is distinct from old.outcome_id
       or new.criterion_id is distinct from old.criterion_id
       or new.created_at is distinct from old.created_at
    then
      raise exception 'Rating identity columns cannot change.'
        using errcode = '23514';
    end if;
  end if;

  new.rated_by := auth.uid();
  new.rated_at := now();
  return new;
end;
$$;

create trigger course_outcome_ratings_align
before insert or update on public.course_outcome_ratings
for each row execute function private.course_outcome_ratings_align();

create trigger course_outcome_ratings_set_updated_at
before update on public.course_outcome_ratings
for each row execute function private.set_updated_at();

create or replace function private.course_outcome_packages_align()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  course_org bigint;
begin
  select c.organization_id into course_org
  from public.courses c
  where c.id = new.course_id;
  if course_org is null or new.organization_id is distinct from course_org then
    raise exception 'Package organization must match the course.'
      using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' then
    if new.organization_id is distinct from old.organization_id
       or new.course_id is distinct from old.course_id
       or new.fill_cycle_id is distinct from old.fill_cycle_id
    then
      raise exception 'Package identity columns cannot change.'
        using errcode = '23514';
    end if;
  end if;
  new.submitted_by := auth.uid();
  new.submitted_at := now();
  return new;
end;
$$;

create trigger course_outcome_packages_align
before insert or update on public.course_outcome_packages
for each row execute function private.course_outcome_packages_align();

create or replace function private.outcome_package_submitted(
  p_course_id bigint,
  p_fill_cycle_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_outcome_packages p
    where p.course_id = p_course_id
      and p.fill_cycle_id is not distinct from p_fill_cycle_id
  );
$$;

revoke all on function private.course_outcome_ratings_align() from public, anon;
revoke all on function private.course_outcome_packages_align() from public, anon;
revoke all on function private.outcome_package_submitted(bigint, bigint) from public, anon;
grant execute on function private.outcome_package_submitted(bigint, bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.course_outcome_ratings enable row level security;
alter table public.course_outcome_packages enable row level security;

revoke all on table public.course_outcome_ratings from anon, authenticated;
revoke all on table public.course_outcome_packages from anon, authenticated;

grant select, insert, update, delete on table public.course_outcome_ratings to authenticated, service_role;
grant select, insert, update, delete on table public.course_outcome_packages to authenticated, service_role;
grant usage, select on sequence public.course_outcome_ratings_id_seq to authenticated, service_role;
grant usage, select on sequence public.course_outcome_packages_id_seq to authenticated, service_role;

create policy course_outcome_ratings_select
on public.course_outcome_ratings
for select
to authenticated
using (
  (select private.can_browse_course(course_id))
  or (
    (select private.outcome_package_submitted(course_id, fill_cycle_id))
    and (
      (select private.parent_linked_to_student(student_profile_id))
      or (select private.student_owns_profile(student_profile_id))
    )
  )
);

create policy course_outcome_ratings_insert
on public.course_outcome_ratings
for insert
to authenticated
with check ((select private.can_manage_course(course_id)));

create policy course_outcome_ratings_update
on public.course_outcome_ratings
for update
to authenticated
using ((select private.can_manage_course(course_id)))
with check ((select private.can_manage_course(course_id)));

create policy course_outcome_ratings_delete
on public.course_outcome_ratings
for delete
to authenticated
using ((select private.can_manage_course(course_id)));

create policy course_outcome_packages_select
on public.course_outcome_packages
for select
to authenticated
using ((select private.can_browse_course(course_id)));

create policy course_outcome_packages_insert
on public.course_outcome_packages
for insert
to authenticated
with check ((select private.can_manage_course(course_id)));

create policy course_outcome_packages_update
on public.course_outcome_packages
for update
to authenticated
using ((select private.can_manage_course(course_id)))
with check ((select private.can_manage_course(course_id)));

create policy course_outcome_packages_delete
on public.course_outcome_packages
for delete
to authenticated
using ((select private.can_manage_course(course_id)));
