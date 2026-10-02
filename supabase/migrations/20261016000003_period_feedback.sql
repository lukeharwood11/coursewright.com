-- US-84: period feedback for a course, student, and fill cycle.
-- The report-card section toggle stays off. This is the source a later assemble step can snapshot.
-- Placeholder: HN-021

create table public.course_period_feedback (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  fill_cycle_id bigint not null references public.report_card_fill_cycles (id) on delete cascade,
  course_id bigint not null references public.courses (id) on delete cascade,
  student_profile_id bigint not null references public.org_profiles (id) on delete cascade,
  body text not null,
  authored_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_period_feedback_body_chk check (
    char_length(btrim(body)) between 1 and 4000
  )
);

create unique index course_period_feedback_scope_key
  on public.course_period_feedback (fill_cycle_id, course_id, student_profile_id);

create index course_period_feedback_student_idx
  on public.course_period_feedback (student_profile_id);

comment on table public.course_period_feedback is
  'Freeform teacher comment for one student in one course during one fill cycle. Not an outcome rating.';

create or replace function private.course_period_feedback_align()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  course_org bigint;
  cycle public.report_card_fill_cycles%rowtype;
  student_org bigint;
  student_ok boolean;
begin
  select c.organization_id into course_org
  from public.courses c
  where c.id = new.course_id;
  if course_org is null or new.organization_id is distinct from course_org then
    raise exception 'Feedback organization must match the course.'
      using errcode = '23514';
  end if;

  select * into cycle
  from public.report_card_fill_cycles
  where id = new.fill_cycle_id;
  if cycle.id is null
     or cycle.organization_id is distinct from new.organization_id
     or cycle.status <> 'open'
     or not cycle.require_period_feedback
  then
    raise exception 'Period feedback needs an open fill cycle that includes it.'
      using errcode = '23514';
  end if;
  if not private.course_in_fill_cycle(cycle.id, new.course_id) then
    raise exception 'That course is outside this fill cycle.'
      using errcode = '23514';
  end if;

  select sp.organization_id, sp.counts_as_student
    into student_org, student_ok
  from public.org_profiles sp
  where sp.id = new.student_profile_id;
  if student_org is distinct from new.organization_id or student_ok is not true then
    raise exception 'Feedback student must be a student in this organization.'
      using errcode = '23514';
  end if;
  if not exists (
    select 1
    from public.enrollments e
    where e.course_id = new.course_id
      and e.student_profile_id = new.student_profile_id
  ) then
    raise exception 'Feedback student must be enrolled in the course.'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    if new.organization_id is distinct from old.organization_id
       or new.course_id is distinct from old.course_id
       or new.student_profile_id is distinct from old.student_profile_id
       or new.fill_cycle_id is distinct from old.fill_cycle_id
       or new.created_at is distinct from old.created_at
    then
      raise exception 'Feedback identity columns cannot change.'
        using errcode = '23514';
    end if;
  end if;

  new.body := btrim(new.body);
  new.authored_by := auth.uid();
  return new;
end;
$$;

create trigger course_period_feedback_align
before insert or update on public.course_period_feedback
for each row execute function private.course_period_feedback_align();

create trigger course_period_feedback_set_updated_at
before update on public.course_period_feedback
for each row execute function private.set_updated_at();

create or replace function private.period_feedback_submitted(
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
    from public.report_card_fill_submissions submission
    where submission.course_id = p_course_id
      and submission.cycle_id = p_fill_cycle_id
      and submission.dependency_kind = 'period_feedback'
  );
$$;

revoke all on function private.course_period_feedback_align() from public, anon;
revoke all on function private.period_feedback_submitted(bigint, bigint) from public, anon;
grant execute on function private.period_feedback_submitted(bigint, bigint) to authenticated, service_role;

alter table public.course_period_feedback enable row level security;

revoke all on table public.course_period_feedback from anon, authenticated;
grant select, insert, update, delete on table public.course_period_feedback to authenticated, service_role;
grant usage, select on sequence public.course_period_feedback_id_seq to authenticated, service_role;

create policy course_period_feedback_select
on public.course_period_feedback
for select
to authenticated
using (
  (select private.can_browse_course(course_id))
  or (
    (select private.period_feedback_submitted(course_id, fill_cycle_id))
    and (
      (select private.parent_linked_to_student(student_profile_id))
      or (select private.student_owns_profile(student_profile_id))
    )
  )
);

create policy course_period_feedback_insert
on public.course_period_feedback
for insert
to authenticated
with check ((select private.can_manage_course(course_id)));

create policy course_period_feedback_update
on public.course_period_feedback
for update
to authenticated
using ((select private.can_manage_course(course_id)))
with check ((select private.can_manage_course(course_id)));

create policy course_period_feedback_delete
on public.course_period_feedback
for delete
to authenticated
using ((select private.can_manage_course(course_id)));
