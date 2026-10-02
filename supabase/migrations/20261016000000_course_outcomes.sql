-- US-81: org outcome rating options and per-course outcomes / criteria.
-- Ratings, packages, and fill cycles are later migrations.
-- Placeholder: HN-021 — Luke applies this with ./scripts/deploy-supabase.sh

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.outcome_rating_options (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  label text not null,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outcome_rating_options_label_len_chk check (
    char_length(btrim(label)) between 1 and 80
  )
);

create unique index outcome_rating_options_org_label_key
  on public.outcome_rating_options (organization_id, lower(label));

create index outcome_rating_options_org_sort_idx
  on public.outcome_rating_options (organization_id, sort_order, id);

comment on table public.outcome_rating_options is
  'Org-defined labels teachers pick when rating course outcomes. Separate from the grading scale.';

create table public.course_outcomes (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  course_id bigint not null references public.courses (id) on delete cascade,
  statement text not null,
  sort_order integer not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_outcomes_statement_len_chk check (
    char_length(btrim(statement)) between 1 and 500
  )
);

create index course_outcomes_course_sort_idx
  on public.course_outcomes (course_id, sort_order, id);

comment on table public.course_outcomes is
  'Per-course learning goal. Criteria are optional children. Not period feedback.';

create table public.course_outcome_criteria (
  id bigserial primary key,
  outcome_id bigint not null references public.course_outcomes (id) on delete cascade,
  statement text not null,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_outcome_criteria_statement_len_chk check (
    char_length(btrim(statement)) between 1 and 500
  )
);

create index course_outcome_criteria_outcome_sort_idx
  on public.course_outcome_criteria (outcome_id, sort_order, id);

comment on table public.course_outcome_criteria is
  'Optional measurable part of a course outcome. When any exist, ratings target criteria, not the parent outcome.';

-- ---------------------------------------------------------------------------
-- Align identity and trim text
-- ---------------------------------------------------------------------------

create or replace function private.outcome_rating_options_align()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.label := regexp_replace(btrim(new.label), '\s+', ' ', 'g');
  if tg_op = 'UPDATE' and new.organization_id is distinct from old.organization_id then
    raise exception 'Rating option organization cannot change.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger outcome_rating_options_align
before insert or update on public.outcome_rating_options
for each row execute function private.outcome_rating_options_align();

create trigger outcome_rating_options_set_updated_at
before update on public.outcome_rating_options
for each row execute function private.set_updated_at();

create or replace function private.course_outcomes_align()
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

  if course_org is null then
    raise exception 'Course not found.'
      using errcode = '23503';
  end if;

  if new.organization_id is distinct from course_org then
    raise exception 'Outcome organization must match the course.'
      using errcode = '23514';
  end if;

  new.statement := regexp_replace(btrim(new.statement), '\s+', ' ', 'g');

  if tg_op = 'UPDATE' then
    if new.course_id is distinct from old.course_id
       or new.organization_id is distinct from old.organization_id
       or new.created_at is distinct from old.created_at
    then
      raise exception 'Outcome identity columns cannot change.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger course_outcomes_align
before insert or update on public.course_outcomes
for each row execute function private.course_outcomes_align();

create trigger course_outcomes_set_updated_at
before update on public.course_outcomes
for each row execute function private.set_updated_at();

create or replace function private.course_outcome_criteria_align()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.statement := regexp_replace(btrim(new.statement), '\s+', ' ', 'g');
  if tg_op = 'UPDATE' then
    if new.outcome_id is distinct from old.outcome_id
       or new.created_at is distinct from old.created_at
    then
      raise exception 'Criterion identity columns cannot change.'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger course_outcome_criteria_align
before insert or update on public.course_outcome_criteria
for each row execute function private.course_outcome_criteria_align();

create trigger course_outcome_criteria_set_updated_at
before update on public.course_outcome_criteria
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed suggested labels (existing orgs and new orgs)
-- ---------------------------------------------------------------------------

create or replace function private.seed_outcome_rating_options(p_org_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.outcome_rating_options (organization_id, label, sort_order)
  select p_org_id, v.label, v.sort_order
  from (
    values
      ('N/A', 0),
      ('Not mastered', 1),
      ('In progress', 2),
      ('Mastered', 3)
  ) as v(label, sort_order)
  where not exists (
    select 1
    from public.outcome_rating_options existing
    where existing.organization_id = p_org_id
  );
end;
$$;

create or replace function private.seed_outcome_rating_options_for_new_org()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.seed_outcome_rating_options(new.id);
  return new;
end;
$$;

create trigger organizations_seed_outcome_rating_options
after insert on public.organizations
for each row execute function private.seed_outcome_rating_options_for_new_org();

select private.seed_outcome_rating_options(id)
from public.organizations;

revoke all on function private.outcome_rating_options_align() from public, anon;
revoke all on function private.course_outcomes_align() from public, anon;
revoke all on function private.course_outcome_criteria_align() from public, anon;
revoke all on function private.seed_outcome_rating_options(bigint) from public, anon, authenticated;
revoke all on function private.seed_outcome_rating_options_for_new_org() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.outcome_rating_options enable row level security;
alter table public.course_outcomes enable row level security;
alter table public.course_outcome_criteria enable row level security;

revoke all on table public.outcome_rating_options from anon, authenticated;
revoke all on table public.course_outcomes from anon, authenticated;
revoke all on table public.course_outcome_criteria from anon, authenticated;

grant select, insert, update, delete on table public.outcome_rating_options to authenticated, service_role;
grant select, insert, update, delete on table public.course_outcomes to authenticated, service_role;
grant select, insert, update, delete on table public.course_outcome_criteria to authenticated, service_role;

grant usage, select on sequence public.outcome_rating_options_id_seq to authenticated, service_role;
grant usage, select on sequence public.course_outcomes_id_seq to authenticated, service_role;
grant usage, select on sequence public.course_outcome_criteria_id_seq to authenticated, service_role;

create policy outcome_rating_options_select
on public.outcome_rating_options
for select
to authenticated
using ((select private.is_org_member(organization_id)));

create policy outcome_rating_options_insert
on public.outcome_rating_options
for insert
to authenticated
with check ((select private.is_org_admin(organization_id)));

create policy outcome_rating_options_update
on public.outcome_rating_options
for update
to authenticated
using ((select private.is_org_admin(organization_id)))
with check ((select private.is_org_admin(organization_id)));

create policy outcome_rating_options_delete
on public.outcome_rating_options
for delete
to authenticated
using ((select private.is_org_admin(organization_id)));

create policy course_outcomes_select
on public.course_outcomes
for select
to authenticated
using (
  (select private.can_browse_course(course_id))
  or (select private.parent_can_view_course(course_id))
  or (select private.student_can_view_course(course_id))
);

create policy course_outcomes_insert
on public.course_outcomes
for insert
to authenticated
with check ((select private.can_manage_course(course_id)));

create policy course_outcomes_update
on public.course_outcomes
for update
to authenticated
using ((select private.can_manage_course(course_id)))
with check ((select private.can_manage_course(course_id)));

create policy course_outcomes_delete
on public.course_outcomes
for delete
to authenticated
using ((select private.can_manage_course(course_id)));

create policy course_outcome_criteria_select
on public.course_outcome_criteria
for select
to authenticated
using (
  exists (
    select 1
    from public.course_outcomes o
    where o.id = outcome_id
      and (
        (select private.can_browse_course(o.course_id))
        or (select private.parent_can_view_course(o.course_id))
        or (select private.student_can_view_course(o.course_id))
      )
  )
);

create policy course_outcome_criteria_insert
on public.course_outcome_criteria
for insert
to authenticated
with check (
  exists (
    select 1
    from public.course_outcomes o
    where o.id = outcome_id
      and (select private.can_manage_course(o.course_id))
  )
);

create policy course_outcome_criteria_update
on public.course_outcome_criteria
for update
to authenticated
using (
  exists (
    select 1
    from public.course_outcomes o
    where o.id = outcome_id
      and (select private.can_manage_course(o.course_id))
  )
)
with check (
  exists (
    select 1
    from public.course_outcomes o
    where o.id = outcome_id
      and (select private.can_manage_course(o.course_id))
  )
);

create policy course_outcome_criteria_delete
on public.course_outcome_criteria
for delete
to authenticated
using (
  exists (
    select 1
    from public.course_outcomes o
    where o.id = outcome_id
      and (select private.can_manage_course(o.course_id))
  )
);
