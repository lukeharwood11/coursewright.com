-- US-83: fill cycles, package submissions, and manual reminders.
-- Grades, attendance, and outcomes can be required. Period feedback stays off
-- until that entity exists. Soft due dates do not lock edits; closing a cycle does.
-- Placeholder: HN-021

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.report_card_fill_cycles (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  label text not null,
  due_on date not null,
  audience text not null,
  require_grades boolean not null default true,
  require_attendance boolean not null default true,
  require_outcomes boolean not null default true,
  require_period_feedback boolean not null default false,
  request_class_lead_feedback boolean not null default false,
  status text not null default 'open',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_card_fill_cycles_label_chk check (
    char_length(btrim(label)) between 1 and 80
  ),
  constraint report_card_fill_cycles_audience_chk check (
    audience in ('organization', 'classes', 'courses')
  ),
  constraint report_card_fill_cycles_status_chk check (
    status in ('open', 'closed')
  )
);

create index report_card_fill_cycles_org_idx
  on public.report_card_fill_cycles (organization_id, status, due_on);

comment on table public.report_card_fill_cycles is
  'Marking-period work bundle. due_on is a soft date. status closed stops new package submits.';

create table public.report_card_fill_cycle_classes (
  cycle_id bigint not null references public.report_card_fill_cycles (id) on delete cascade,
  class_id bigint not null references public.classes (id) on delete cascade,
  primary key (cycle_id, class_id)
);

create table public.report_card_fill_cycle_courses (
  cycle_id bigint not null references public.report_card_fill_cycles (id) on delete cascade,
  course_id bigint not null references public.courses (id) on delete cascade,
  primary key (cycle_id, course_id)
);

create table public.report_card_fill_submissions (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  cycle_id bigint not null references public.report_card_fill_cycles (id) on delete cascade,
  dependency_kind text not null,
  course_id bigint references public.courses (id) on delete cascade,
  class_id bigint references public.classes (id) on delete cascade,
  submitter_user_id uuid references public.profiles (id) on delete set null,
  submitted_at timestamptz not null default now(),
  constraint report_card_fill_submissions_kind_chk check (
    dependency_kind in ('grades', 'attendance', 'outcomes', 'period_feedback')
  ),
  constraint report_card_fill_submissions_scope_chk check (
    (
      dependency_kind in ('grades', 'outcomes', 'period_feedback')
      and course_id is not null
      and class_id is null
    )
    or (
      dependency_kind = 'attendance'
      and num_nonnulls(course_id, class_id) = 1
    )
  )
);

create unique index report_card_fill_submissions_scope_key
  on public.report_card_fill_submissions (cycle_id, dependency_kind, course_id, class_id)
  nulls not distinct;

comment on table public.report_card_fill_submissions is
  'Checkpoint that a package was submitted for a fill cycle. Marks and grades stay editable.';

create table public.report_card_fill_reminders (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  cycle_id bigint not null references public.report_card_fill_cycles (id) on delete cascade,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  sent_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index report_card_fill_reminders_recipient_idx
  on public.report_card_fill_reminders (recipient_user_id, cycle_id, created_at desc);

comment on table public.report_card_fill_reminders is
  'Manual home nudge. Not an email and not an Activity row.';

alter table public.course_outcome_ratings
  add constraint course_outcome_ratings_fill_cycle_id_fkey
  foreign key (fill_cycle_id) references public.report_card_fill_cycles (id) on delete cascade;

alter table public.course_outcome_packages
  add constraint course_outcome_packages_fill_cycle_id_fkey
  foreign key (fill_cycle_id) references public.report_card_fill_cycles (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Align
-- ---------------------------------------------------------------------------

create or replace function private.fill_cycles_align()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.label := regexp_replace(btrim(new.label), '\s+', ' ', 'g');
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
  elsif new.organization_id is distinct from old.organization_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Fill cycle identity columns cannot change.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger report_card_fill_cycles_align
before insert or update on public.report_card_fill_cycles
for each row execute function private.fill_cycles_align();

create trigger report_card_fill_cycles_set_updated_at
before update on public.report_card_fill_cycles
for each row execute function private.set_updated_at();

create or replace function private.fill_cycle_class_in_org()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.report_card_fill_cycles cycle
    join public.classes class_row on class_row.id = new.class_id
    where cycle.id = new.cycle_id
      and class_row.organization_id = cycle.organization_id
      and class_row.deleted_at is null
  ) then
    raise exception 'That class is not in this fill cycle’s organization.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger report_card_fill_cycle_classes_align
before insert or update on public.report_card_fill_cycle_classes
for each row execute function private.fill_cycle_class_in_org();

create or replace function private.fill_cycle_course_in_org()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.report_card_fill_cycles cycle
    join public.courses course on course.id = new.course_id
    where cycle.id = new.cycle_id
      and course.organization_id = cycle.organization_id
  ) then
    raise exception 'That course is not in this fill cycle’s organization.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger report_card_fill_cycle_courses_align
before insert or update on public.report_card_fill_cycle_courses
for each row execute function private.fill_cycle_course_in_org();

create or replace function private.course_in_fill_cycle(
  p_cycle_id bigint,
  p_course_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.report_card_fill_cycles cycle
    join public.courses course on course.id = p_course_id
    where cycle.id = p_cycle_id
      and course.organization_id = cycle.organization_id
      and (
        cycle.audience = 'organization'
        or (
          cycle.audience = 'courses'
          and exists (
            select 1
            from public.report_card_fill_cycle_courses link
            where link.cycle_id = cycle.id
              and link.course_id = course.id
          )
        )
        or (
          cycle.audience = 'classes'
          and exists (
            select 1
            from public.report_card_fill_cycle_classes link
            join public.class_members member on member.class_id = link.class_id
            join public.enrollments enrollment
              on enrollment.student_profile_id = member.student_profile_id
             and enrollment.course_id = course.id
             and enrollment.status = 'active'
            where link.cycle_id = cycle.id
          )
        )
      )
  );
$$;

create or replace function private.class_in_fill_cycle(
  p_cycle_id bigint,
  p_class_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.report_card_fill_cycles cycle
    join public.classes class_row on class_row.id = p_class_id
    where cycle.id = p_cycle_id
      and class_row.organization_id = cycle.organization_id
      and class_row.deleted_at is null
      and cycle.audience in ('organization', 'classes')
      and (
        cycle.audience = 'organization'
        or exists (
          select 1
          from public.report_card_fill_cycle_classes link
          where link.cycle_id = cycle.id
            and link.class_id = class_row.id
        )
      )
  );
$$;

create or replace function private.fill_submissions_align()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cycle public.report_card_fill_cycles%rowtype;
begin
  select * into cycle
  from public.report_card_fill_cycles
  where id = new.cycle_id;

  if cycle.id is null or cycle.organization_id is distinct from new.organization_id then
    raise exception 'Submission organization must match the fill cycle.'
      using errcode = '23514';
  end if;
  if cycle.status <> 'open' then
    raise exception 'That fill cycle is closed.'
      using errcode = '23514';
  end if;
  if new.dependency_kind = 'grades' and not cycle.require_grades
     or new.dependency_kind = 'attendance' and not cycle.require_attendance
     or new.dependency_kind = 'outcomes' and not cycle.require_outcomes
     or new.dependency_kind = 'period_feedback' and not cycle.require_period_feedback
  then
    raise exception 'That package is not part of this fill cycle.'
      using errcode = '23514';
  end if;

  if new.course_id is not null
     and not private.course_in_fill_cycle(cycle.id, new.course_id)
  then
    raise exception 'That course is outside this fill cycle.'
      using errcode = '23514';
  end if;
  if new.class_id is not null
     and not private.class_in_fill_cycle(cycle.id, new.class_id)
  then
    raise exception 'That class is outside this fill cycle.'
      using errcode = '23514';
  end if;

  if new.dependency_kind in ('grades', 'outcomes', 'period_feedback')
     and not private.can_manage_course(new.course_id)
  then
    raise exception 'You cannot submit that course package.'
      using errcode = '42501';
  end if;
  if new.dependency_kind = 'attendance' and new.course_id is not null
     and not private.can_manage_course(new.course_id)
  then
    raise exception 'You cannot submit that attendance package.'
      using errcode = '42501';
  end if;
  if new.dependency_kind = 'attendance' and new.class_id is not null
     and not (
       private.is_org_admin(cycle.organization_id)
       or private.is_class_lead(new.class_id)
     )
  then
    raise exception 'You cannot submit that attendance package.'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' then
    if new.organization_id is distinct from old.organization_id
       or new.cycle_id is distinct from old.cycle_id
       or new.dependency_kind is distinct from old.dependency_kind
       or new.course_id is distinct from old.course_id
       or new.class_id is distinct from old.class_id
    then
      raise exception 'Submission identity columns cannot change.'
        using errcode = '23514';
    end if;
  end if;

  new.submitter_user_id := auth.uid();
  new.submitted_at := now();
  return new;
end;
$$;

create trigger report_card_fill_submissions_align
before insert or update on public.report_card_fill_submissions
for each row execute function private.fill_submissions_align();

create or replace function private.require_open_fill_cycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.fill_cycle_id is null then
    return new;
  end if;
  if not exists (
    select 1
    from public.report_card_fill_cycles cycle
    where cycle.id = new.fill_cycle_id
      and cycle.organization_id = new.organization_id
      and cycle.status = 'open'
  ) then
    raise exception 'That fill cycle is not open.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger course_outcome_ratings_require_open_cycle
before insert or update on public.course_outcome_ratings
for each row execute function private.require_open_fill_cycle();

create trigger course_outcome_packages_require_open_cycle
before insert or update on public.course_outcome_packages
for each row execute function private.require_open_fill_cycle();

create or replace function private.fill_reminders_align()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.report_card_fill_cycles cycle
    where cycle.id = new.cycle_id
      and cycle.organization_id = new.organization_id
  ) then
    raise exception 'Reminder organization must match the fill cycle.'
      using errcode = '23514';
  end if;
  if not exists (
    select 1
    from public.memberships member
    where member.organization_id = new.organization_id
      and member.user_id = new.recipient_user_id
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'instructor')
  ) then
    raise exception 'Remind a staff member of this organization.'
      using errcode = '23514';
  end if;
  new.sent_by := auth.uid();
  return new;
end;
$$;

create trigger report_card_fill_reminders_align
before insert on public.report_card_fill_reminders
for each row execute function private.fill_reminders_align();

revoke all on function private.fill_cycles_align() from public, anon;
revoke all on function private.fill_cycle_class_in_org() from public, anon;
revoke all on function private.fill_cycle_course_in_org() from public, anon;
revoke all on function private.course_in_fill_cycle(bigint, bigint) from public, anon;
revoke all on function private.class_in_fill_cycle(bigint, bigint) from public, anon;
revoke all on function private.fill_submissions_align() from public, anon;
revoke all on function private.require_open_fill_cycle() from public, anon;
revoke all on function private.fill_reminders_align() from public, anon;

create or replace function public.fill_cycle_scope(p_organization_id bigint)
returns table(cycle_id bigint, course_id bigint, class_id bigint, title text)
language sql
stable
security definer
set search_path = ''
as $$
  select cycle.id, course.id, null::bigint, course.title
  from public.report_card_fill_cycles cycle
  join public.courses course on course.organization_id = cycle.organization_id
  where cycle.organization_id = p_organization_id
    and course.status = 'active'
    and private.can_browse_as_staff(p_organization_id)
    and private.course_in_fill_cycle(cycle.id, course.id)
    and (
      private.is_org_admin(p_organization_id)
      or private.is_course_instructor(course.id)
      or exists (
        select 1
        from public.class_leaders lead
        join public.class_members member on member.class_id = lead.class_id
        join public.enrollments enrollment
          on enrollment.student_profile_id = member.student_profile_id
         and enrollment.course_id = course.id
         and enrollment.status = 'active'
        where lead.user_id = (select auth.uid())
          and private.class_in_fill_cycle(cycle.id, lead.class_id)
      )
    )
  union all
  select cycle.id, null::bigint, class_row.id, class_row.title
  from public.report_card_fill_cycles cycle
  join public.classes class_row on class_row.organization_id = cycle.organization_id
  where cycle.organization_id = p_organization_id
    and class_row.deleted_at is null
    and private.can_browse_as_staff(p_organization_id)
    and private.class_in_fill_cycle(cycle.id, class_row.id)
    and (
      private.is_org_admin(p_organization_id)
      or private.is_class_lead(class_row.id)
    );
$$;

revoke all on function public.fill_cycle_scope(bigint) from public, anon;
grant execute on function public.fill_cycle_scope(bigint) to authenticated, service_role;
grant execute on function private.course_in_fill_cycle(bigint, bigint) to authenticated, service_role;
grant execute on function private.class_in_fill_cycle(bigint, bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.report_card_fill_cycles enable row level security;
alter table public.report_card_fill_cycle_classes enable row level security;
alter table public.report_card_fill_cycle_courses enable row level security;
alter table public.report_card_fill_submissions enable row level security;
alter table public.report_card_fill_reminders enable row level security;

revoke all on table public.report_card_fill_cycles from anon, authenticated;
revoke all on table public.report_card_fill_cycle_classes from anon, authenticated;
revoke all on table public.report_card_fill_cycle_courses from anon, authenticated;
revoke all on table public.report_card_fill_submissions from anon, authenticated;
revoke all on table public.report_card_fill_reminders from anon, authenticated;

grant select, insert, update, delete on table public.report_card_fill_cycles to authenticated, service_role;
grant select, insert, update, delete on table public.report_card_fill_cycle_classes to authenticated, service_role;
grant select, insert, update, delete on table public.report_card_fill_cycle_courses to authenticated, service_role;
grant select, insert, update, delete on table public.report_card_fill_submissions to authenticated, service_role;
grant select, insert, delete on table public.report_card_fill_reminders to authenticated, service_role;

grant usage, select on sequence public.report_card_fill_cycles_id_seq to authenticated, service_role;
grant usage, select on sequence public.report_card_fill_submissions_id_seq to authenticated, service_role;
grant usage, select on sequence public.report_card_fill_reminders_id_seq to authenticated, service_role;

create policy report_card_fill_cycles_select
on public.report_card_fill_cycles
for select to authenticated
using ((select private.can_browse_as_staff(organization_id)));

create policy report_card_fill_cycles_insert
on public.report_card_fill_cycles
for insert to authenticated
with check ((select private.is_org_admin(organization_id)));

create policy report_card_fill_cycles_update
on public.report_card_fill_cycles
for update to authenticated
using ((select private.is_org_admin(organization_id)))
with check ((select private.is_org_admin(organization_id)));

create policy report_card_fill_cycles_delete
on public.report_card_fill_cycles
for delete to authenticated
using ((select private.is_org_admin(organization_id)));

create policy report_card_fill_cycle_classes_select
on public.report_card_fill_cycle_classes
for select to authenticated
using (
  exists (
    select 1
    from public.report_card_fill_cycles cycle
    where cycle.id = cycle_id
      and (select private.can_browse_as_staff(cycle.organization_id))
  )
);

create policy report_card_fill_cycle_classes_write
on public.report_card_fill_cycle_classes
for all to authenticated
using (
  exists (
    select 1
    from public.report_card_fill_cycles cycle
    where cycle.id = cycle_id
      and (select private.is_org_admin(cycle.organization_id))
  )
)
with check (
  exists (
    select 1
    from public.report_card_fill_cycles cycle
    where cycle.id = cycle_id
      and (select private.is_org_admin(cycle.organization_id))
  )
);

create policy report_card_fill_cycle_courses_select
on public.report_card_fill_cycle_courses
for select to authenticated
using (
  exists (
    select 1
    from public.report_card_fill_cycles cycle
    where cycle.id = cycle_id
      and (select private.can_browse_as_staff(cycle.organization_id))
  )
);

create policy report_card_fill_cycle_courses_write
on public.report_card_fill_cycle_courses
for all to authenticated
using (
  exists (
    select 1
    from public.report_card_fill_cycles cycle
    where cycle.id = cycle_id
      and (select private.is_org_admin(cycle.organization_id))
  )
)
with check (
  exists (
    select 1
    from public.report_card_fill_cycles cycle
    where cycle.id = cycle_id
      and (select private.is_org_admin(cycle.organization_id))
  )
);

create policy report_card_fill_submissions_select
on public.report_card_fill_submissions
for select to authenticated
using ((select private.can_browse_as_staff(organization_id)));

create policy report_card_fill_submissions_insert
on public.report_card_fill_submissions
for insert to authenticated
with check ((select private.can_browse_as_staff(organization_id)));

create policy report_card_fill_submissions_update
on public.report_card_fill_submissions
for update to authenticated
using ((select private.can_browse_as_staff(organization_id)))
with check ((select private.can_browse_as_staff(organization_id)));

create policy report_card_fill_reminders_select
on public.report_card_fill_reminders
for select to authenticated
using (
  recipient_user_id = (select auth.uid())
  or (select private.is_org_admin(organization_id))
);

create policy report_card_fill_reminders_insert
on public.report_card_fill_reminders
for insert to authenticated
with check ((select private.is_org_admin(organization_id)));
