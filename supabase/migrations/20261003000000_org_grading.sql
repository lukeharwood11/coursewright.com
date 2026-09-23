-- Org grading P0.
-- Separate from grade_scheme / grade_labels (those stay age-level K–12 metadata).
-- Quiz scores stay on quiz_attempts / quiz_attempt_answers (no dual-write).
-- Report cards store workflow + a derived snapshot, not a second score store.
-- Access: enrollment + parent_student_links. Class is not a grade container.
-- Tier 1 View / Tier 2 View+Actions are enforced in policies below
-- (parents and learners read; course staff and org admins write).

-- ---------------------------------------------------------------------------
-- Organization grading scale (one row per org; new orgs default to none)
-- ---------------------------------------------------------------------------

create table public.organization_grading_scales (
  organization_id bigint primary key
    references public.organizations (id) on delete cascade,
  mode text not null default 'none',
  pass_threshold numeric(5,2),
  bands jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint organization_grading_scales_mode_chk
    check (mode in ('none', 'pass_fail', 'letter'))
);

comment on table public.organization_grading_scales is
  'Org-wide grading mode and thresholds. Not age-level grade_scheme.';
comment on column public.organization_grading_scales.mode is
  'none = points only; pass_fail = one inclusive pass percent; letter = min-percent bands.';
comment on column public.organization_grading_scales.bands is
  'Letter bands [{label, min_percent}]. Inclusive min; the higher band wins a tie. One band starts at 0.';

create or replace function private.validate_grading_scale()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  elem jsonb;
  lab text;
  minp numeric;
  labels text[] := '{}';
  mins numeric[] := '{}';
  seen_zero boolean := false;
  normalized jsonb := '[]'::jsonb;
begin
  if new.mode = 'none' then
    new.pass_threshold := null;
    new.bands := '[]'::jsonb;
  elsif new.mode = 'pass_fail' then
    if new.pass_threshold is null
       or new.pass_threshold < 0
       or new.pass_threshold > 100 then
      raise exception 'Pass needs a percent from 0 to 100.'
        using errcode = '23514';
    end if;
    new.pass_threshold := round(new.pass_threshold, 2);
    new.bands := '[]'::jsonb;
  elsif new.mode = 'letter' then
    new.pass_threshold := null;
    if jsonb_typeof(new.bands) is distinct from 'array'
       or jsonb_array_length(new.bands) < 1 then
      raise exception 'Add at least one letter, including a band that starts at 0.'
        using errcode = '23514';
    end if;
    for elem in
      select value from jsonb_array_elements(new.bands)
    loop
      lab := btrim(elem->>'label');
      if lab is null or lab = '' or char_length(lab) > 24 then
        raise exception 'Each letter needs a short name.'
          using errcode = '23514';
      end if;
      if (elem->>'min_percent') is null
         or (elem->>'min_percent') !~ '^[0-9]+(\.[0-9]+)?$' then
        raise exception 'Each letter needs a minimum percent.'
          using errcode = '23514';
      end if;
      minp := round((elem->>'min_percent')::numeric, 2);
      if minp < 0 or minp > 100 then
        raise exception 'Percents have to stay between 0 and 100.'
          using errcode = '23514';
      end if;
      if lab = any (labels) then
        raise exception 'Letter names have to be different.'
          using errcode = '23514';
      end if;
      if minp = any (mins) then
        raise exception 'Two letters can’t start at the same percent.'
          using errcode = '23514';
      end if;
      if minp = 0 then
        seen_zero := true;
      end if;
      labels := labels || lab;
      mins := mins || minp;
      normalized := normalized || jsonb_build_array(
        jsonb_build_object('label', lab, 'min_percent', minp)
      );
    end loop;
    if not seen_zero then
      raise exception 'One letter has to start at 0 so every score has a name.'
        using errcode = '23514';
    end if;
    new.bands := normalized;
  end if;

  new.updated_by := (select auth.uid());
  return new;
end;
$$;

create trigger organization_grading_scales_validate
before insert or update on public.organization_grading_scales
for each row execute function private.validate_grading_scale();

create trigger organization_grading_scales_set_updated_at
before update on public.organization_grading_scales
for each row execute function private.set_updated_at();

create or replace function private.create_default_grading_scale()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_grading_scales (organization_id, mode)
  values (new.id, 'none')
  on conflict (organization_id) do nothing;
  return new;
end;
$$;

create trigger organizations_default_grading_scale
after insert on public.organizations
for each row execute function private.create_default_grading_scale();

insert into public.organization_grading_scales (organization_id, mode)
select id, 'none'
from public.organizations
on conflict (organization_id) do nothing;

alter table public.organization_grading_scales enable row level security;

revoke all on table public.organization_grading_scales from anon, authenticated;
grant select, insert, update on table public.organization_grading_scales to authenticated;
grant select, insert, update, delete on table public.organization_grading_scales to service_role;

create policy organization_grading_scales_select
on public.organization_grading_scales
for select to authenticated
using ((select private.is_org_member(organization_id)));

create policy organization_grading_scales_insert
on public.organization_grading_scales
for insert to authenticated
with check ((select private.is_org_admin(organization_id)));

create policy organization_grading_scales_update
on public.organization_grading_scales
for update to authenticated
using ((select private.is_org_admin(organization_id)))
with check ((select private.is_org_admin(organization_id)));

-- ---------------------------------------------------------------------------
-- Course finals (override only — the mean is derived) + append-only audit
-- ---------------------------------------------------------------------------

create table public.course_final_grades (
  enrollment_id bigint primary key
    references public.enrollments (id) on delete cascade,
  override_label text,
  override_note text,
  overridden_by uuid references public.profiles (id) on delete set null,
  overridden_at timestamptz,
  constraint course_final_grades_label_chk check (
    override_label is null or char_length(btrim(override_label)) > 0
  ),
  constraint course_final_grades_note_chk check (
    override_note is null or char_length(override_note) <= 2000
  )
);

comment on table public.course_final_grades is
  'Teacher final override for one enrollment. The mean of locked percents is not stored.';

create table public.grade_override_events (
  id bigserial primary key,
  organization_id bigint not null
    references public.organizations (id) on delete cascade,
  kind text not null,
  enrollment_id bigint references public.enrollments (id) on delete set null,
  quiz_attempt_id bigint references public.quiz_attempts (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  note text,
  previous_value text,
  new_value text,
  created_at timestamptz not null default now(),
  constraint grade_override_events_kind_chk
    check (kind in ('assignment', 'final')),
  constraint grade_override_events_note_chk check (
    note is null or char_length(note) <= 2000
  )
);

create index grade_override_events_enrollment_idx
  on public.grade_override_events (enrollment_id, created_at desc);
create index grade_override_events_attempt_idx
  on public.grade_override_events (quiz_attempt_id, created_at desc);

comment on table public.grade_override_events is
  'Append-only stamp when a teacher saves an assignment grade or a course final override.';

alter table public.course_final_grades enable row level security;
alter table public.grade_override_events enable row level security;

revoke all on table public.course_final_grades from anon, authenticated;
revoke all on table public.grade_override_events from anon, authenticated;
grant select on table public.course_final_grades to authenticated;
grant select on table public.grade_override_events to authenticated;
grant select, insert, update, delete on table public.course_final_grades to service_role;
grant select, insert, update, delete on table public.grade_override_events to service_role;

-- Tier 1 View: parents (linked) and the learner read a final.
-- Tier 2 View+Actions: org admins and that course’s teachers read every enrollment.
create policy course_final_grades_select
on public.course_final_grades
for select to authenticated
using (
  exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.id = enrollment_id
      and (
        (select private.is_org_admin(c.organization_id))
        or (select private.is_course_instructor(c.id))
        or (
          (
            (select private.parent_linked_to_student(e.student_profile_id))
            or (select private.student_owns_profile(e.student_profile_id))
          )
          and c.visibility = 'published'
          and c.status = 'active'
        )
      )
  )
);

create policy grade_override_events_select
on public.grade_override_events
for select to authenticated
using (
  (select private.is_org_admin(organization_id))
  or (
    enrollment_id is not null
    and exists (
      select 1
      from public.enrollments e
      join public.courses c on c.id = e.course_id
      where e.id = enrollment_id
        and (select private.is_course_instructor(c.id))
    )
  )
);

-- ---------------------------------------------------------------------------
-- Derived percents (latest attempt per quiz; locked = teacher Save grade)
-- ---------------------------------------------------------------------------

create or replace function private.percent_label(
  p_mode text,
  p_pass numeric,
  p_bands jsonb,
  p_percent numeric
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  band jsonb;
  best_label text := null;
  best_min numeric := null;
  minp numeric;
begin
  if p_percent is null or p_mode is null or p_mode = 'none' then
    return null;
  end if;
  if p_mode = 'pass_fail' then
    if p_pass is null then
      return null;
    end if;
    if p_percent >= p_pass then
      return 'Pass';
    end if;
    return 'Fail';
  end if;
  if p_mode = 'letter' and jsonb_typeof(p_bands) = 'array' then
    for band in
      select value from jsonb_array_elements(p_bands)
    loop
      minp := (band->>'min_percent')::numeric;
      if p_percent >= minp and (best_min is null or minp > best_min) then
        best_min := minp;
        best_label := band->>'label';
      end if;
    end loop;
  end if;
  return best_label;
end;
$$;

create or replace function private.enrollment_quiz_rows(p_enrollment_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with enrollment as (
    select e.id, e.student_profile_id, e.course_id
    from public.enrollments e
    where e.id = p_enrollment_id
  ),
  latest as (
    select distinct on (a.quiz_id)
      a.id as attempt_id,
      a.quiz_id,
      q.title,
      a.teacher_graded_at,
      a.score,
      a.score_total
    from enrollment e
    join public.quizzes q
      on q.course_id = e.course_id
     and q.deleted_at is null
    join public.quiz_attempts a
      on a.quiz_id = q.id
     and a.student_profile_id = e.student_profile_id
    order by a.quiz_id, a.submitted_at desc
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'quiz_id', latest.quiz_id,
        'attempt_id', latest.attempt_id,
        'title', latest.title,
        'locked', (
          latest.teacher_graded_at is not null
          and coalesce(latest.score_total, 0) > 0
        ),
        'earned', latest.score,
        'possible', latest.score_total,
        'percent', case
          when latest.teacher_graded_at is not null
           and coalesce(latest.score_total, 0) > 0
          then round((latest.score / latest.score_total) * 100, 2)
          else null
        end
      )
      order by latest.title, latest.quiz_id
    ),
    '[]'::jsonb
  )
  from latest;
$$;

create or replace function private.mean_locked_percent(p_items jsonb)
returns numeric
language plpgsql
immutable
set search_path = ''
as $$
declare
  item jsonb;
  total numeric := 0;
  n int := 0;
  pct numeric;
begin
  if jsonb_typeof(p_items) is distinct from 'array' then
    return null;
  end if;
  for item in
    select value from jsonb_array_elements(p_items)
  loop
    if (item->>'locked')::boolean is true and (item->>'percent') is not null then
      pct := (item->>'percent')::numeric;
      total := total + pct;
      n := n + 1;
    end if;
  end loop;
  if n = 0 then
    return null;
  end if;
  return round(total / n, 2);
end;
$$;

-- ---------------------------------------------------------------------------
-- Final override
-- ---------------------------------------------------------------------------

create or replace function public.set_course_final_override(
  p_enrollment_id bigint,
  p_label text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  v_course_id bigint;
  v_org_id bigint;
  v_course_title text;
  v_student_id bigint;
  v_student_name text;
  v_mode text;
  v_pass numeric;
  v_bands jsonb;
  v_label text := nullif(btrim(coalesce(p_label, '')), '');
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_prev text;
begin
  if caller is null then
    raise exception 'Sign in to save a final.' using errcode = '42501';
  end if;
  if v_note is not null and char_length(v_note) > 2000 then
    raise exception 'Keep the note under 2000 characters.' using errcode = '23514';
  end if;

  select c.id, c.organization_id, c.title, e.student_profile_id, sp.name
  into v_course_id, v_org_id, v_course_title, v_student_id, v_student_name
  from public.enrollments e
  join public.courses c on c.id = e.course_id
  join public.student_profiles sp on sp.id = e.student_profile_id
  where e.id = p_enrollment_id;

  if v_course_id is null then
    raise exception 'That enrollment was not found.' using errcode = 'P0002';
  end if;
  if not private.can_manage_course(v_course_id) then
    raise exception 'You can’t change this final.' using errcode = '42501';
  end if;

  select s.mode, s.pass_threshold, s.bands
  into v_mode, v_pass, v_bands
  from public.organization_grading_scales s
  where s.organization_id = v_org_id;

  if v_mode is null then
    v_mode := 'none';
  end if;

  if v_label is not null and v_mode = 'none' then
    raise exception 'This organization shows percents only, so there is no final label to set.'
      using errcode = '23514';
  end if;

  if v_label is not null and v_mode = 'pass_fail' and v_label not in ('Pass', 'Fail') then
    raise exception 'Choose Pass or Fail.' using errcode = '23514';
  end if;

  if v_label is not null and v_mode = 'letter' then
    if not exists (
      select 1
      from jsonb_array_elements(coalesce(v_bands, '[]'::jsonb)) band
      where band->>'label' = v_label
    ) then
      raise exception 'Choose a letter from the organization scale.'
        using errcode = '23514';
    end if;
  end if;

  select override_label into v_prev
  from public.course_final_grades
  where enrollment_id = p_enrollment_id;

  insert into public.course_final_grades (
    enrollment_id, override_label, override_note, overridden_by, overridden_at
  )
  values (
    p_enrollment_id,
    v_label,
    case when v_label is null then null else v_note end,
    case when v_label is null then null else caller end,
    case when v_label is null then null else now() end
  )
  on conflict (enrollment_id) do update
  set override_label = excluded.override_label,
      override_note = excluded.override_note,
      overridden_by = excluded.overridden_by,
      overridden_at = excluded.overridden_at;

  insert into public.grade_override_events (
    organization_id, kind, enrollment_id, actor_id, note, previous_value, new_value
  )
  values (
    v_org_id,
    'final',
    p_enrollment_id,
    caller,
    v_note,
    v_prev,
    v_label
  );

  -- Activity only when a final label is set or an existing override changes.
  -- Mode none cannot set a label. Clearing back to the average still notifies.
  if v_label is not null or v_prev is not null then
    perform private.notify_published_grade(
      v_org_id,
      v_student_id,
      'course_final',
      caller,
      'Final',
      left(
        coalesce(v_student_name, 'Student') || ' · ' || coalesce(v_label, 'the average'),
        160
      ),
      coalesce(v_course_title, ''),
      null,
      p_enrollment_id
    );
  end if;
end;
$$;

revoke all on function public.set_course_final_override(bigint, text, text)
  from public, anon;
grant execute on function public.set_course_final_override(bigint, text, text)
  to authenticated, service_role;

-- Assignment audit follows the existing Save grade path (grade_quiz_attempt).
create or replace function private.audit_assignment_grade()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org bigint;
  v_enrollment bigint;
  v_note text;
  v_quiz_title text;
  v_course_title text;
  v_student_name text;
begin
  if new.teacher_graded_at is null
     or new.teacher_graded_at is not distinct from old.teacher_graded_at then
    return new;
  end if;

  select q.organization_id, q.title, c.title
  into v_org, v_quiz_title, v_course_title
  from public.quizzes q
  join public.courses c on c.id = q.course_id
  where q.id = new.quiz_id;

  select e.id into v_enrollment
  from public.enrollments e
  join public.quizzes q on q.course_id = e.course_id
  where q.id = new.quiz_id
    and e.student_profile_id = new.student_profile_id
  order by case when e.status = 'active' then 0 else 1 end, e.id
  limit 1;

  v_note := nullif(current_setting('coursewright.grade_note', true), '');

  insert into public.grade_override_events (
    organization_id, kind, enrollment_id, quiz_attempt_id,
    actor_id, note, previous_value, new_value
  )
  values (
    v_org,
    'assignment',
    v_enrollment,
    new.id,
    coalesce(new.graded_by, (select auth.uid())),
    v_note,
    case
      when old.score is null or old.score_total is null then null
      else old.score::text || '/' || old.score_total::text
    end,
    case
      when new.score is null or new.score_total is null then null
      else new.score::text || '/' || new.score_total::text
    end
  );

  select name into v_student_name
  from public.student_profiles
  where id = new.student_profile_id;

  -- Save grade lock only. Submit and partial attempts do not set teacher_graded_at.
  perform private.notify_published_grade(
    v_org,
    new.student_profile_id,
    'quiz_grade',
    coalesce(new.graded_by, (select auth.uid())),
    coalesce(nullif(btrim(v_quiz_title), ''), 'Quiz'),
    left(
      coalesce(v_student_name, 'Student')
        || ' · '
        || coalesce(new.score::text, '0')
        || '/'
        || coalesce(new.score_total::text, '0'),
      160
    ),
    coalesce(v_course_title, ''),
    new.id,
    v_enrollment
  );

  return new;
end;
$$;

create trigger quiz_attempts_audit_grade
after update of teacher_graded_at on public.quiz_attempts
for each row execute function private.audit_assignment_grade();

create or replace function public.grade_quiz_attempt_noted(
  p_attempt_id bigint,
  p_points jsonb,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if v_note is not null and char_length(v_note) > 2000 then
    raise exception 'Keep the note under 2000 characters.' using errcode = '23514';
  end if;
  perform set_config('coursewright.grade_note', coalesce(v_note, ''), true);
  perform public.grade_quiz_attempt(p_attempt_id, p_points);
end;
$$;

revoke all on function public.grade_quiz_attempt_noted(bigint, jsonb, text)
  from public, anon;
grant execute on function public.grade_quiz_attempt_noted(bigint, jsonb, text)
  to authenticated, service_role;

comment on function public.grade_quiz_attempt_noted(bigint, jsonb, text) is
  'Same Save grade path as grade_quiz_attempt, plus an optional note on the audit row.';

-- ---------------------------------------------------------------------------
-- Read models
-- ---------------------------------------------------------------------------

create or replace function public.course_gradebook(p_course_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org bigint;
  caller uuid := (select auth.uid());
begin
  if caller is null or not private.can_manage_course(p_course_id) then
    raise exception 'You can’t open this gradebook.' using errcode = '42501';
  end if;

  select organization_id into v_org
  from public.courses
  where id = p_course_id;

  return jsonb_build_object(
    'organization_id', v_org,
    'rows', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'enrollment_id', e.id,
          'student_profile_id', e.student_profile_id,
          'student_name', sp.name,
          'status', e.status,
          'items', private.enrollment_quiz_rows(e.id),
          'final_percent', private.mean_locked_percent(private.enrollment_quiz_rows(e.id)),
          'override_label', f.override_label,
          'override_note', f.override_note,
          'overridden_at', f.overridden_at,
          'overridden_by_name', actor.name
        )
        order by sp.name, e.id
      )
      from public.enrollments e
      join public.student_profiles sp on sp.id = e.student_profile_id
      left join public.course_final_grades f on f.enrollment_id = e.id
      left join public.profiles actor on actor.id = f.overridden_by
      where e.course_id = p_course_id
        and e.status = 'active'
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.course_gradebook(bigint) from public, anon;
grant execute on function public.course_gradebook(bigint) to authenticated, service_role;

create or replace function private.caller_can_read_enrollment(p_enrollment_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.id = p_enrollment_id
      and (
        (select private.is_org_admin(c.organization_id))
        or (select private.is_course_instructor(c.id))
        or (
          (
            (select private.parent_linked_to_student(e.student_profile_id))
            or (select private.student_owns_profile(e.student_profile_id))
          )
          and c.visibility = 'published'
          and c.status = 'active'
        )
      )
  );
$$;

create or replace function public.student_course_grades(p_student_profile_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to see grades.' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(row_data order by row_data->>'course_title')
    from (
      select jsonb_build_object(
        'enrollment_id', e.id,
        'course_id', e.course_id,
        'course_title', c.title,
        'items', private.enrollment_quiz_rows(e.id),
        'final_percent', private.mean_locked_percent(private.enrollment_quiz_rows(e.id)),
        'override_label', f.override_label,
        'override_note', f.override_note,
        'overridden_at', f.overridden_at,
        'overridden_by_name', actor.name
      ) as row_data
      from public.enrollments e
      join public.courses c on c.id = e.course_id
      left join public.course_final_grades f on f.enrollment_id = e.id
      left join public.profiles actor on actor.id = f.overridden_by
      where e.student_profile_id = p_student_profile_id
        and e.status = 'active'
        and private.caller_can_read_enrollment(e.id)
    ) visible
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.student_course_grades(bigint) from public, anon;
grant execute on function public.student_course_grades(bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Report cards (presentation lifecycle only)
-- ---------------------------------------------------------------------------

create table public.report_card_instances (
  id bigserial primary key,
  organization_id bigint not null
    references public.organizations (id) on delete cascade,
  student_profile_id bigint not null
    references public.student_profiles (id) on delete cascade,
  course_id bigint not null
    references public.courses (id) on delete cascade,
  enrollment_id bigint not null
    references public.enrollments (id) on delete cascade,
  status text not null default 'draft',
  narrative text not null default '',
  snapshot jsonb not null default '{}'::jsonb,
  generated_by uuid references public.profiles (id) on delete set null,
  submitted_by uuid references public.profiles (id) on delete set null,
  submitted_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_card_instances_status_chk
    check (status in ('draft', 'submitted', 'sent')),
  constraint report_card_instances_narrative_chk
    check (char_length(narrative) <= 8000)
);

create unique index report_card_instances_one_draft
  on public.report_card_instances (enrollment_id)
  where status = 'draft';

create index report_card_instances_student_idx
  on public.report_card_instances (student_profile_id, created_at desc);
create index report_card_instances_course_idx
  on public.report_card_instances (course_id, status);

comment on table public.report_card_instances is
  'Report card workflow. snapshot is a derived copy for the issued card, not a score store.';

create table public.report_card_deliveries (
  id bigserial primary key,
  report_card_instance_id bigint not null
    references public.report_card_instances (id) on delete cascade,
  recipient_kind text not null,
  recipient_user_id uuid references public.profiles (id) on delete set null,
  recipient_email text,
  recipient_key text not null,
  channel text not null,
  status text not null default 'queued',
  attempt_count int not null default 0,
  last_error text,
  queued_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint report_card_deliveries_kind_chk
    check (recipient_kind in ('student', 'parent')),
  constraint report_card_deliveries_channel_chk
    check (channel in ('email', 'in_app')),
  constraint report_card_deliveries_status_chk
    check (status in ('queued', 'sent', 'failed')),
  constraint report_card_deliveries_attempt_chk
    check (attempt_count >= 0),
  constraint report_card_deliveries_identity_key
    unique (report_card_instance_id, recipient_kind, channel, recipient_key)
);

create index report_card_deliveries_status_idx
  on public.report_card_deliveries (status, report_card_instance_id);

comment on table public.report_card_deliveries is
  'One row per recipient and channel. Submit enqueues; mail does not block submit.';

create trigger report_card_instances_set_updated_at
before update on public.report_card_instances
for each row execute function private.set_updated_at();

create or replace function private.report_card_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_setting('coursewright.report_card_write', true) = '1' then
    return new;
  end if;
  if old.status is distinct from 'draft' or new.status is distinct from 'draft' then
    raise exception 'This report card can’t be edited.'
      using errcode = '23514';
  end if;
  if new.organization_id is distinct from old.organization_id
     or new.student_profile_id is distinct from old.student_profile_id
     or new.course_id is distinct from old.course_id
     or new.enrollment_id is distinct from old.enrollment_id
     or new.snapshot is distinct from old.snapshot
     or new.generated_by is distinct from old.generated_by
     or new.submitted_by is distinct from old.submitted_by
     or new.submitted_at is distinct from old.submitted_at
     or new.sent_at is distinct from old.sent_at
     or new.created_at is distinct from old.created_at then
    raise exception 'Only the comment can change on a draft.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger report_card_instances_guard_update
before update on public.report_card_instances
for each row execute function private.report_card_guard_update();

alter table public.report_card_instances enable row level security;
alter table public.report_card_deliveries enable row level security;

revoke all on table public.report_card_instances from anon, authenticated;
revoke all on table public.report_card_deliveries from anon, authenticated;
grant select, update on table public.report_card_instances to authenticated;
grant select on table public.report_card_deliveries to authenticated;
grant select, insert, update, delete on table public.report_card_instances to service_role;
grant select, insert, update, delete on table public.report_card_deliveries to service_role;
grant usage, select on sequence public.report_card_instances_id_seq to authenticated, service_role;
grant usage, select on sequence public.report_card_deliveries_id_seq to service_role;

create policy report_card_instances_select
on public.report_card_instances
for select to authenticated
using (
  (
    status = 'sent'
    and (
      (select private.parent_linked_to_student(student_profile_id))
      or (select private.student_owns_profile(student_profile_id))
    )
  )
  or (select private.is_org_admin(organization_id))
  or (select private.is_course_instructor(course_id))
);

create policy report_card_instances_update_narrative
on public.report_card_instances
for update to authenticated
using (
  status = 'draft'
  and (select private.can_manage_course(course_id))
)
with check (
  status = 'draft'
  and (select private.can_manage_course(course_id))
);

create policy report_card_deliveries_select
on public.report_card_deliveries
for select to authenticated
using (
  exists (
    select 1
    from public.report_card_instances card
    where card.id = report_card_instance_id
      and (
        (select private.is_org_admin(card.organization_id))
        or (select private.can_manage_course(card.course_id))
      )
  )
);

create or replace function private.report_card_snapshot(p_enrollment_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_items jsonb;
  v_final numeric;
  v_mode text;
  v_pass numeric;
  v_bands jsonb;
  v_updated timestamptz;
  v_course_id bigint;
  v_course_title text;
  v_student_id bigint;
  v_student_name text;
  v_org bigint;
  v_override text;
  v_note text;
  v_overridden_at timestamptz;
  item jsonb;
  labeled jsonb := '[]'::jsonb;
begin
  select
    e.course_id, c.title, e.student_profile_id, sp.name, c.organization_id,
    f.override_label, f.override_note, f.overridden_at
  into
    v_course_id, v_course_title, v_student_id, v_student_name, v_org,
    v_override, v_note, v_overridden_at
  from public.enrollments e
  join public.courses c on c.id = e.course_id
  join public.student_profiles sp on sp.id = e.student_profile_id
  left join public.course_final_grades f on f.enrollment_id = e.id
  where e.id = p_enrollment_id;

  select s.mode, s.pass_threshold, s.bands, s.updated_at
  into v_mode, v_pass, v_bands, v_updated
  from public.organization_grading_scales s
  where s.organization_id = v_org;

  if v_mode is null then
    v_mode := 'none';
    v_bands := '[]'::jsonb;
  end if;

  v_items := private.enrollment_quiz_rows(p_enrollment_id);
  v_final := private.mean_locked_percent(v_items);

  for item in
    select value from jsonb_array_elements(v_items)
  loop
    labeled := labeled || jsonb_build_array(
      item || jsonb_build_object(
        'label', private.percent_label(
          v_mode, v_pass, v_bands, nullif(item->>'percent', '')::numeric
        )
      )
    );
  end loop;

  return jsonb_build_object(
    'scale_mode', v_mode,
    'scale_updated_at', v_updated,
    'course_id', v_course_id,
    'course_title', v_course_title,
    'student_profile_id', v_student_id,
    'student_name', v_student_name,
    'enrollment_id', p_enrollment_id,
    'final_percent', v_final,
    'final_label', private.percent_label(v_mode, v_pass, v_bands, v_final),
    'override_label', v_override,
    'override_note', v_note,
    'overridden_at', v_overridden_at,
    'items', labeled
  );
end;
$$;

create or replace function private.upsert_report_card_draft(
  p_enrollment_id bigint,
  p_actor uuid
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_org bigint;
  v_student bigint;
  v_course bigint;
  v_snapshot jsonb;
begin
  select c.organization_id, e.student_profile_id, e.course_id
  into v_org, v_student, v_course
  from public.enrollments e
  join public.courses c on c.id = e.course_id
  where e.id = p_enrollment_id
    and e.status = 'active';

  if v_course is null then
    raise exception 'That student isn’t enrolled in an active course.'
      using errcode = 'P0002';
  end if;
  if not private.can_manage_course(v_course) then
    raise exception 'You can’t draft a report card for this course.'
      using errcode = '42501';
  end if;

  v_snapshot := private.report_card_snapshot(p_enrollment_id);

  select id into v_id
  from public.report_card_instances
  where enrollment_id = p_enrollment_id
    and status = 'draft';

  perform set_config('coursewright.report_card_write', '1', true);

  if v_id is null then
    insert into public.report_card_instances (
      organization_id, student_profile_id, course_id, enrollment_id,
      status, snapshot, generated_by
    )
    values (v_org, v_student, v_course, p_enrollment_id, 'draft', v_snapshot, p_actor)
    returning id into v_id;
  else
    update public.report_card_instances
    set snapshot = v_snapshot
    where id = v_id;
  end if;

  return v_id;
end;
$$;

create or replace function public.generate_report_card(p_enrollment_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to generate a report card.' using errcode = '42501';
  end if;
  return private.upsert_report_card_draft(p_enrollment_id, (select auth.uid()));
end;
$$;

create or replace function public.generate_student_report_cards(p_student_profile_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_ids jsonb := '[]'::jsonb;
  v_enrollment bigint;
  v_any boolean := false;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to generate a report card.' using errcode = '42501';
  end if;

  for v_enrollment in
    select e.id
    from public.enrollments e
    where e.student_profile_id = p_student_profile_id
      and e.status = 'active'
      and private.can_manage_course(e.course_id)
    order by e.id
  loop
    v_any := true;
    v_id := private.upsert_report_card_draft(v_enrollment, (select auth.uid()));
    v_ids := v_ids || to_jsonb(v_id);
  end loop;

  if not v_any then
    raise exception 'No course you teach is ready for a report card.'
      using errcode = 'P0002';
  end if;
  return v_ids;
end;
$$;

create or replace function public.generate_course_report_cards(p_course_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_ids jsonb := '[]'::jsonb;
  v_enrollment bigint;
begin
  if (select auth.uid()) is null or not private.can_manage_course(p_course_id) then
    raise exception 'You can’t draft report cards for this course.'
      using errcode = '42501';
  end if;

  for v_enrollment in
    select e.id
    from public.enrollments e
    where e.course_id = p_course_id
      and e.status = 'active'
    order by e.id
  loop
    v_id := private.upsert_report_card_draft(v_enrollment, (select auth.uid()));
    v_ids := v_ids || to_jsonb(v_id);
  end loop;
  return v_ids;
end;
$$;

create or replace function public.refresh_report_card(p_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enrollment bigint;
  v_course bigint;
  v_status text;
begin
  select enrollment_id, course_id, status
  into v_enrollment, v_course, v_status
  from public.report_card_instances
  where id = p_id;

  if v_enrollment is null then
    raise exception 'That report card was not found.' using errcode = 'P0002';
  end if;
  if not private.can_manage_course(v_course) then
    raise exception 'You can’t refresh this report card.' using errcode = '42501';
  end if;
  if v_status is distinct from 'draft' then
    raise exception 'Only a draft can refresh from current grades.'
      using errcode = '23514';
  end if;

  perform set_config('coursewright.report_card_write', '1', true);
  update public.report_card_instances
  set snapshot = private.report_card_snapshot(v_enrollment)
  where id = p_id;
end;
$$;

create or replace function private.enqueue_report_card_deliveries(p_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  card record;
  parent_row record;
  v_email text;
  v_user uuid;
  v_preview text;
begin
  select
    i.id,
    i.organization_id,
    i.student_profile_id,
    i.course_id,
    c.title as course_title,
    sp.name as student_name,
    sp.student_email,
    sp.user_id as student_user_id,
    i.submitted_by
  into card
  from public.report_card_instances i
  join public.student_profiles sp on sp.id = i.student_profile_id
  join public.courses c on c.id = i.course_id
  where i.id = p_id;

  v_preview := left(
    'Report card for ' || card.student_name || ' in ' || card.course_title,
    160
  );

  v_email := nullif(lower(btrim(coalesce(card.student_email, ''))), '');
  v_user := card.student_user_id;

  if v_email is null then
    insert into public.report_card_deliveries (
      report_card_instance_id, recipient_kind, recipient_user_id, recipient_email,
      recipient_key, channel, status, attempt_count, last_error, sent_at
    )
    values (
      card.id, 'student', v_user, null, 'missing-student-email', 'email',
      'failed', 1, 'No student email on file.', null
    )
    on conflict (report_card_instance_id, recipient_kind, channel, recipient_key)
    do nothing;
  else
    insert into public.report_card_deliveries (
      report_card_instance_id, recipient_kind, recipient_user_id, recipient_email,
      recipient_key, channel, status
    )
    values (
      card.id, 'student', v_user, v_email, v_email, 'email', 'queued'
    )
    on conflict (report_card_instance_id, recipient_kind, channel, recipient_key)
    do nothing;
  end if;

  if v_user is not null then
    insert into public.report_card_deliveries (
      report_card_instance_id, recipient_kind, recipient_user_id, recipient_email,
      recipient_key, channel, status, sent_at
    )
    values (
      card.id, 'student', v_user, v_email, v_user::text, 'in_app', 'sent', now()
    )
    on conflict (report_card_instance_id, recipient_kind, channel, recipient_key)
    do nothing;

    perform set_config('coursewright.notification_write', '1', true);
    insert into public.notifications (
      organization_id, user_id, kind, actor_id, title, preview, audience_label,
      report_card_instance_id
    )
    values (
      card.organization_id, v_user, 'report_card', card.submitted_by,
      'Report card', v_preview, card.course_title, card.id
    )
    on conflict (user_id, report_card_instance_id)
      where kind = 'report_card' and report_card_instance_id is not null
    do nothing;
  end if;

  for parent_row in
    select l.parent_user_id, p.email, p.name
    from public.parent_student_links l
    join public.profiles p on p.id = l.parent_user_id
    where l.student_profile_id = card.student_profile_id
  loop
    v_email := nullif(lower(btrim(coalesce(parent_row.email, ''))), '');
    if v_email is not null then
      insert into public.report_card_deliveries (
        report_card_instance_id, recipient_kind, recipient_user_id, recipient_email,
        recipient_key, channel, status
      )
      values (
        card.id, 'parent', parent_row.parent_user_id, v_email,
        parent_row.parent_user_id::text, 'email', 'queued'
      )
      on conflict (report_card_instance_id, recipient_kind, channel, recipient_key)
      do nothing;
    end if;

    insert into public.report_card_deliveries (
      report_card_instance_id, recipient_kind, recipient_user_id, recipient_email,
      recipient_key, channel, status, sent_at
    )
    values (
      card.id, 'parent', parent_row.parent_user_id, v_email,
      parent_row.parent_user_id::text || ':in_app', 'in_app', 'sent', now()
    )
    on conflict (report_card_instance_id, recipient_kind, channel, recipient_key)
    do nothing;

    perform set_config('coursewright.notification_write', '1', true);
    insert into public.notifications (
      organization_id, user_id, kind, actor_id, title, preview, audience_label,
      report_card_instance_id
    )
    values (
      card.organization_id, parent_row.parent_user_id, 'report_card', card.submitted_by,
      'Report card', v_preview, card.course_title, card.id
    )
    on conflict (user_id, report_card_instance_id)
      where kind = 'report_card' and report_card_instance_id is not null
    do nothing;
  end loop;
end;
$$;

create or replace function public.submit_report_card(p_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course bigint;
  v_status text;
  v_enrollment bigint;
  caller uuid := (select auth.uid());
begin
  if caller is null then
    raise exception 'Sign in to send a report card.' using errcode = '42501';
  end if;

  select course_id, status, enrollment_id
  into v_course, v_status, v_enrollment
  from public.report_card_instances
  where id = p_id
  for update;

  if v_course is null then
    raise exception 'That report card was not found.' using errcode = 'P0002';
  end if;
  if not private.can_manage_course(v_course) then
    raise exception 'You can’t send this report card.' using errcode = '42501';
  end if;
  if v_status is distinct from 'draft' then
    raise exception 'This report card was already submitted.'
      using errcode = '23514';
  end if;

  perform set_config('coursewright.report_card_write', '1', true);
  update public.report_card_instances
  set
    snapshot = private.report_card_snapshot(v_enrollment),
    status = 'submitted',
    submitted_by = caller,
    submitted_at = now()
  where id = p_id;

  perform private.enqueue_report_card_deliveries(p_id);

  update public.report_card_instances
  set status = 'sent', sent_at = now()
  where id = p_id;
end;
$$;

create or replace function public.resend_report_card_delivery(p_delivery_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course bigint;
  v_channel text;
  v_status text;
begin
  select card.course_id, d.channel, d.status
  into v_course, v_channel, v_status
  from public.report_card_deliveries d
  join public.report_card_instances card on card.id = d.report_card_instance_id
  where d.id = p_delivery_id;

  if v_course is null then
    raise exception 'That delivery was not found.' using errcode = 'P0002';
  end if;
  if not private.can_manage_course(v_course) then
    raise exception 'You can’t resend this.' using errcode = '42501';
  end if;
  if v_channel is distinct from 'email' or v_status is distinct from 'failed' then
    raise exception 'Only a failed email can be sent again.' using errcode = '23514';
  end if;

  update public.report_card_deliveries
  set status = 'queued',
      attempt_count = 0,
      last_error = null,
      queued_at = now(),
      sent_at = null
  where id = p_delivery_id;
end;
$$;

revoke all on function public.generate_report_card(bigint) from public, anon;
revoke all on function public.generate_student_report_cards(bigint) from public, anon;
revoke all on function public.generate_course_report_cards(bigint) from public, anon;
revoke all on function public.refresh_report_card(bigint) from public, anon;
revoke all on function public.submit_report_card(bigint) from public, anon;
revoke all on function public.resend_report_card_delivery(bigint) from public, anon;

grant execute on function public.generate_report_card(bigint) to authenticated, service_role;
grant execute on function public.generate_student_report_cards(bigint) to authenticated, service_role;
grant execute on function public.generate_course_report_cards(bigint) to authenticated, service_role;
grant execute on function public.refresh_report_card(bigint) to authenticated, service_role;
grant execute on function public.submit_report_card(bigint) to authenticated, service_role;
grant execute on function public.resend_report_card_delivery(bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Activity kind for in-app report cards
-- ---------------------------------------------------------------------------

alter table public.notifications
  add column if not exists report_card_instance_id bigint
    references public.report_card_instances (id) on delete cascade;

alter table public.notifications
  add column if not exists student_profile_id bigint
    references public.student_profiles (id) on delete cascade;

alter table public.notifications
  add column if not exists quiz_attempt_id bigint
    references public.quiz_attempts (id) on delete cascade;

alter table public.notifications
  add column if not exists enrollment_id bigint
    references public.enrollments (id) on delete cascade;

create index if not exists notifications_report_card_instance_id_idx
  on public.notifications (report_card_instance_id)
  where report_card_instance_id is not null;

create index if not exists notifications_quiz_attempt_id_idx
  on public.notifications (quiz_attempt_id)
  where quiz_attempt_id is not null;

alter table public.notifications
  drop constraint if exists notifications_kind_chk;

alter table public.notifications
  add constraint notifications_kind_chk
  check (kind in (
    'discussion_message',
    'discussion_mention',
    'announcement',
    'report_card',
    'quiz_grade',
    'course_final'
  ));

create unique index if not exists notifications_user_report_card_key
  on public.notifications (user_id, report_card_instance_id)
  where kind = 'report_card' and report_card_instance_id is not null;

create unique index if not exists notifications_user_quiz_grade_key
  on public.notifications (user_id, quiz_attempt_id)
  where kind = 'quiz_grade' and quiz_attempt_id is not null;

create unique index if not exists notifications_user_course_final_key
  on public.notifications (user_id, enrollment_id)
  where kind = 'course_final' and enrollment_id is not null;

-- One unread Activity row per person per published grade. A later Save grade
-- or final override refreshes that row. No email. Report cards stay on submit.
create or replace function private.notify_published_grade(
  p_organization_id bigint,
  p_student_profile_id bigint,
  p_kind text,
  p_actor uuid,
  p_title text,
  p_preview text,
  p_audience text,
  p_quiz_attempt_id bigint,
  p_enrollment_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient record;
begin
  if p_organization_id is null or p_student_profile_id is null then
    return;
  end if;
  if p_kind = 'quiz_grade' and p_quiz_attempt_id is null then
    return;
  end if;
  if p_kind = 'course_final' and p_enrollment_id is null then
    return;
  end if;
  if p_kind not in ('quiz_grade', 'course_final') then
    return;
  end if;

  perform set_config('coursewright.notification_write', '1', true);

  for recipient in
    select sp.user_id as user_id
    from public.student_profiles sp
    where sp.id = p_student_profile_id
      and sp.user_id is not null
    union
    select l.parent_user_id as user_id
    from public.parent_student_links l
    where l.student_profile_id = p_student_profile_id
      and l.parent_user_id is not null
  loop
    if p_kind = 'quiz_grade' then
      insert into public.notifications (
        organization_id, user_id, kind, actor_id, title, preview, audience_label,
        student_profile_id, quiz_attempt_id, enrollment_id
      )
      values (
        p_organization_id, recipient.user_id, 'quiz_grade', p_actor,
        p_title, coalesce(p_preview, ''), coalesce(p_audience, ''),
        p_student_profile_id, p_quiz_attempt_id, p_enrollment_id
      )
      on conflict (user_id, quiz_attempt_id)
        where kind = 'quiz_grade' and quiz_attempt_id is not null
      do update
      set
        actor_id = excluded.actor_id,
        title = excluded.title,
        preview = excluded.preview,
        audience_label = excluded.audience_label,
        student_profile_id = excluded.student_profile_id,
        enrollment_id = excluded.enrollment_id,
        created_at = now(),
        read_at = null;
    else
      insert into public.notifications (
        organization_id, user_id, kind, actor_id, title, preview, audience_label,
        student_profile_id, enrollment_id
      )
      values (
        p_organization_id, recipient.user_id, 'course_final', p_actor,
        p_title, coalesce(p_preview, ''), coalesce(p_audience, ''),
        p_student_profile_id, p_enrollment_id
      )
      on conflict (user_id, enrollment_id)
        where kind = 'course_final' and enrollment_id is not null
      do update
      set
        actor_id = excluded.actor_id,
        title = excluded.title,
        preview = excluded.preview,
        audience_label = excluded.audience_label,
        student_profile_id = excluded.student_profile_id,
        created_at = now(),
        read_at = null;
    end if;
  end loop;
end;
$$;

revoke all on function private.notify_published_grade(
  bigint, bigint, text, uuid, text, text, text, bigint, bigint
) from public, anon, authenticated;

create or replace function private.notification_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1
     or current_setting('coursewright.notification_write', true) = '1' then
    return new;
  end if;

  if new.organization_id is distinct from old.organization_id
     or new.user_id is distinct from old.user_id
     or new.kind is distinct from old.kind
     or new.discussion_id is distinct from old.discussion_id
     or new.discussion_message_id is distinct from old.discussion_message_id
     or new.announcement_id is distinct from old.announcement_id
     or new.report_card_instance_id is distinct from old.report_card_instance_id
     or new.student_profile_id is distinct from old.student_profile_id
     or new.quiz_attempt_id is distinct from old.quiz_attempt_id
     or new.enrollment_id is distinct from old.enrollment_id
     or new.actor_id is distinct from old.actor_id
     or new.title is distinct from old.title
     or new.preview is distinct from old.preview
     or new.audience_label is distinct from old.audience_label
     or new.created_at is distinct from old.created_at then
    raise exception 'That notification can’t be changed.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;
