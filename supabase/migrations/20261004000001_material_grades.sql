-- Material grades: possible points on a gradable submission material,
-- teacher points and feedback on the student slot, included in the gradebook mean.

alter table public.materials
  add column if not exists gradable boolean not null default false,
  add column if not exists points_possible numeric(8,2);

alter table public.materials
  drop constraint if exists materials_gradable_points_chk,
  drop constraint if exists materials_gradable_accept_chk;

alter table public.materials
  add constraint materials_gradable_points_chk check (
    (gradable = false and points_possible is null)
    or (
      gradable = true
      and points_possible > 0
      and points_possible <= 9999.99
    )
  ),
  add constraint materials_gradable_accept_chk check (
    gradable = false or accept_submissions = true
  );

comment on column public.materials.gradable is
  'When true, a teacher grade is points out of points_possible and counts in the course gradebook. When false, the teacher can leave feedback only.';
comment on column public.materials.points_possible is
  'Possible points for a gradable material. Null when the material is not gradable. Fractions such as 4.5 are allowed.';

alter table public.material_submissions
  add column if not exists points_earned numeric(8,2),
  add column if not exists points_possible numeric(8,2),
  add column if not exists feedback text not null default '',
  add column if not exists graded_at timestamptz,
  add column if not exists graded_by uuid references public.profiles (id) on delete set null;

alter table public.material_submissions
  drop constraint if exists material_submissions_feedback_chk,
  drop constraint if exists material_submissions_grade_chk;

alter table public.material_submissions
  add constraint material_submissions_feedback_chk check (
    char_length(feedback) <= 4000
  ),
  add constraint material_submissions_grade_chk check (
    (
      graded_at is null
      and points_earned is null
      and points_possible is null
      and graded_by is null
    )
    or (
      graded_at is not null
      and (
        (points_earned is null and points_possible is null)
        or (
          points_earned is not null
          and points_possible is not null
          and points_possible > 0
          and points_earned >= 0
          and points_earned <= points_possible
        )
      )
    )
  );

comment on column public.material_submissions.points_earned is
  'Teacher points for a gradable material. Null when the grade is feedback only.';
comment on column public.material_submissions.points_possible is
  'Possible points snapshotted when the teacher saved the grade.';
comment on column public.material_submissions.feedback is
  'Teacher feedback shown to the family. Required when the material is not gradable.';

alter table public.notifications
  add column if not exists material_submission_id bigint
    references public.material_submissions (id) on delete cascade;

create index if not exists notifications_material_submission_id_idx
  on public.notifications (material_submission_id)
  where material_submission_id is not null;

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
    'course_final',
    'material_grade'
  ));

create unique index if not exists notifications_user_material_grade_key
  on public.notifications (user_id, material_submission_id)
  where kind = 'material_grade' and material_submission_id is not null;

alter table public.grade_override_events
  add column if not exists material_submission_id bigint
    references public.material_submissions (id) on delete set null;

create index if not exists grade_override_events_material_submission_idx
  on public.grade_override_events (material_submission_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Save material page also stores gradable + points
-- ---------------------------------------------------------------------------

create or replace function public.save_material_page(
  p_material_id bigint,
  p_placement jsonb default null,
  p_blocks jsonb default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  material public.materials%rowtype;
  next_title text;
  next_description text;
  next_url text;
  next_scheduled date;
  next_due date;
  next_accept boolean;
  next_allow_past boolean;
  next_limit int;
  next_types text[];
  next_due_at timestamptz;
  next_due_tz text;
  next_gradable boolean;
  next_points numeric(8,2);
  placement_changed boolean := false;
  current_blocks jsonb;
  next_blocks jsonb;
  blocks_changed boolean := false;
  new_version int;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to save.' using errcode = '42501';
  end if;

  select * into material
  from public.materials
  where id = p_material_id;

  if not found then
    raise exception 'That material isn’t there.' using errcode = 'P0002';
  end if;

  if material.course_id is not null then
    if not private.can_manage_course(material.course_id) then
      raise exception 'You can’t edit this material.' using errcode = '42501';
    end if;
  elsif material.template_id is not null then
    if not private.can_edit_template(material.template_id) then
      raise exception 'You can’t edit this material.' using errcode = '42501';
    end if;
  else
    raise exception 'You can’t edit this material.' using errcode = '42501';
  end if;

  if p_placement is not null then
    next_title := coalesce(p_placement->>'title', material.title);
    next_description := coalesce(p_placement->>'description', material.description);
    if material.kind = 'link' then
      next_url := p_placement->>'url';
    else
      next_url := material.url;
    end if;
    if jsonb_exists(p_placement, 'scheduled_date') then
      next_scheduled := nullif(p_placement->>'scheduled_date', '')::date;
    else
      next_scheduled := material.scheduled_date;
    end if;
    if jsonb_exists(p_placement, 'due_date') then
      next_due := nullif(p_placement->>'due_date', '')::date;
    else
      next_due := material.due_date;
    end if;
    if jsonb_exists(p_placement, 'accept_submissions') then
      next_accept := coalesce((p_placement->>'accept_submissions')::boolean, false);
    else
      next_accept := material.accept_submissions;
    end if;
    if jsonb_exists(p_placement, 'allow_submissions_past_due') then
      next_allow_past := coalesce((p_placement->>'allow_submissions_past_due')::boolean, true);
    else
      next_allow_past := material.allow_submissions_past_due;
    end if;
    if jsonb_exists(p_placement, 'submission_limit') then
      next_limit := coalesce((p_placement->>'submission_limit')::int, material.submission_limit);
    else
      next_limit := material.submission_limit;
    end if;
    if jsonb_exists(p_placement, 'submission_file_types')
       and jsonb_typeof(p_placement->'submission_file_types') = 'array' then
      select coalesce(array_agg(value), '{}'::text[])
      into next_types
      from jsonb_array_elements_text(p_placement->'submission_file_types') as value;
    else
      next_types := material.submission_file_types;
    end if;
    if next_due is null then
      next_due_at := null;
      next_due_tz := null;
    else
      if jsonb_exists(p_placement, 'due_at') then
        next_due_at := nullif(p_placement->>'due_at', '')::timestamptz;
      else
        next_due_at := material.due_at;
      end if;
      if jsonb_exists(p_placement, 'due_timezone') then
        next_due_tz := nullif(p_placement->>'due_timezone', '');
      else
        next_due_tz := material.due_timezone;
      end if;
    end if;
    if not next_accept then
      next_gradable := false;
      next_points := null;
    elsif jsonb_exists(p_placement, 'gradable') then
      next_gradable := coalesce((p_placement->>'gradable')::boolean, false);
      if next_gradable then
        next_points := nullif(p_placement->>'points_possible', '')::numeric;
      else
        next_points := null;
      end if;
    else
      next_gradable := material.gradable;
      next_points := material.points_possible;
    end if;

    if next_accept and coalesce(cardinality(next_types), 0) = 0 then
      raise exception 'Choose at least one kind of file families can turn in.'
        using errcode = '23514';
    end if;
    if next_limit < 1 or next_limit > 10 then
      raise exception 'Submissions allowed must be from 1 to 10.'
        using errcode = '23514';
    end if;
    if exists (
      select 1
      from unnest(coalesce(next_types, '{}'::text[])) as kind
      where kind not in ('pdf', 'image', 'document', 'audio', 'video')
    ) then
      raise exception 'That file type isn’t one families can turn in.'
        using errcode = '23514';
    end if;
    if next_due_at is not null and next_due_tz is null then
      raise exception 'Choose a timezone for the due time.'
        using errcode = '23514';
    end if;
    if next_gradable and (
      next_points is null or next_points <= 0 or next_points > 9999.99
    ) then
      raise exception 'Possible points must be greater than 0.'
        using errcode = '23514';
    end if;

    placement_changed :=
      next_title is distinct from material.title
      or next_description is distinct from material.description
      or next_url is distinct from material.url
      or next_scheduled is distinct from material.scheduled_date
      or next_due is distinct from material.due_date
      or next_accept is distinct from material.accept_submissions
      or next_allow_past is distinct from material.allow_submissions_past_due
      or next_limit is distinct from material.submission_limit
      or next_types is distinct from material.submission_file_types
      or next_due_at is distinct from material.due_at
      or next_due_tz is distinct from material.due_timezone
      or next_gradable is distinct from material.gradable
      or next_points is distinct from material.points_possible;
  end if;

  if p_blocks is not null then
    if material.kind <> 'page' then
      raise exception 'Only page materials have lesson content.' using errcode = 'P0001';
    end if;
    if jsonb_typeof(p_blocks) <> 'array' then
      raise exception 'Page content is not in a shape we can save.' using errcode = 'P0001';
    end if;

    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'kind', b.kind,
            'body', b.body,
            'position', b.position,
            'file_id', b.file_id
          )
          order by b.position, b.id
        )
        from public.blocks b
        where b.material_id = p_material_id
          and b.deleted_at is null
      ),
      '[]'::jsonb
    )
    into current_blocks;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'kind', elem->>'kind',
          'body', coalesce(elem->'body', '{}'::jsonb),
          'position', coalesce((elem->>'position')::int, (ord - 1)::int),
          'file_id', case
            when elem->>'file_id' ~ '^[0-9]+$' then (elem->>'file_id')::bigint
            else null
          end
        )
        order by coalesce((elem->>'position')::int, (ord - 1)::int), ord
      ),
      '[]'::jsonb
    )
    into next_blocks
    from jsonb_array_elements(p_blocks) with ordinality as t(elem, ord);

    if exists (
      select 1
      from jsonb_array_elements(p_blocks) as elem
      where coalesce(elem->>'kind', '') not in ('rich_text', 'video')
    ) then
      raise exception 'That block type isn’t supported yet.' using errcode = 'P0001';
    end if;

    blocks_changed := current_blocks is distinct from next_blocks;
  end if;

  if not placement_changed and not blocks_changed then
    return material.current_version;
  end if;

  perform set_config('coursewright.skip_version', 'on', true);

  if placement_changed then
    update public.materials
    set
      title = next_title,
      description = next_description,
      url = next_url,
      scheduled_date = next_scheduled,
      due_date = next_due,
      accept_submissions = next_accept,
      allow_submissions_past_due = next_allow_past,
      submission_limit = next_limit,
      submission_file_types = coalesce(next_types, '{}'::text[]),
      due_at = next_due_at,
      due_timezone = next_due_tz,
      gradable = next_gradable,
      points_possible = next_points
    where id = p_material_id;
  end if;

  if blocks_changed then
    update public.blocks
    set deleted_at = now()
    where material_id = p_material_id
      and deleted_at is null;

    insert into public.blocks (material_id, kind, body, position, file_id)
    select
      p_material_id,
      elem->>'kind',
      coalesce(elem->'body', '{}'::jsonb),
      coalesce((elem->>'position')::int, (ord - 1)::int),
      case
        when elem->>'file_id' ~ '^[0-9]+$' then (elem->>'file_id')::bigint
        else null
      end
    from jsonb_array_elements(p_blocks) with ordinality as t(elem, ord);
  end if;

  update public.materials m
  set current_version = m.current_version + 1
  where m.id = p_material_id
  returning m.current_version into new_version;

  insert into public.material_versions (material_id, version, snapshot, changed_by, change_type)
  values (
    p_material_id,
    new_version,
    private.material_page_snapshot(p_material_id),
    (select auth.uid()),
    'update'
  );

  return new_version;
end;
$$;

-- ---------------------------------------------------------------------------
-- Teacher saves points (gradable) or feedback only
-- ---------------------------------------------------------------------------

create or replace function public.grade_material_submission(
  p_submission_id bigint,
  p_points numeric,
  p_feedback text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  submission public.material_submissions%rowtype;
  material public.materials%rowtype;
  v_feedback text := coalesce(p_feedback, '');
  v_points numeric(8,2);
  v_possible numeric(8,2);
  v_enrollment bigint;
  v_course_title text;
  v_student_name text;
  v_prev text;
  v_next text;
begin
  if caller is null then
    raise exception 'Sign in to save a grade.' using errcode = '42501';
  end if;
  if char_length(v_feedback) > 4000 then
    raise exception 'Keep feedback under 4000 characters.' using errcode = '23514';
  end if;

  select * into submission
  from public.material_submissions
  where id = p_submission_id
    and deleted_at is null;

  if submission.id is null then
    raise exception 'That submission was not found.' using errcode = 'P0002';
  end if;
  if not private.can_manage_course(submission.course_id) then
    raise exception 'You can’t grade this submission.' using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.material_submission_versions v
    where v.submission_id = submission.id
  ) then
    raise exception 'There is nothing to grade yet.' using errcode = 'P0001';
  end if;

  select * into material
  from public.materials
  where id = submission.material_id
    and deleted_at is null;

  if material.id is null or not material.accept_submissions then
    raise exception 'This material does not accept submissions.' using errcode = 'P0001';
  end if;

  if material.gradable then
    if p_points is null then
      raise exception 'Enter the points.' using errcode = '23514';
    end if;
    v_points := round(p_points, 2);
    v_possible := material.points_possible;
    if v_possible is null or v_points < 0 or v_points > v_possible then
      raise exception 'Points must be from 0 up to the points possible.'
        using errcode = '23514';
    end if;
  else
    if nullif(btrim(v_feedback), '') is null then
      raise exception 'Write feedback for this submission.' using errcode = '23514';
    end if;
    v_points := null;
    v_possible := null;
  end if;

  v_prev := case
    when submission.graded_at is null then null
    when submission.points_earned is null then 'feedback'
    else submission.points_earned::text || '/' || submission.points_possible::text
  end;
  v_next := case
    when v_points is null then 'feedback'
    else v_points::text || '/' || v_possible::text
  end;

  update public.material_submissions
  set
    points_earned = v_points,
    points_possible = v_possible,
    feedback = v_feedback,
    graded_at = now(),
    graded_by = caller
  where id = submission.id;

  select e.id, c.title, sp.name
  into v_enrollment, v_course_title, v_student_name
  from public.enrollments e
  join public.courses c on c.id = e.course_id
  join public.student_profiles sp on sp.id = e.student_profile_id
  where e.course_id = submission.course_id
    and e.student_profile_id = submission.student_profile_id
  order by case when e.status = 'active' then 0 else 1 end, e.id
  limit 1;

  insert into public.grade_override_events (
    organization_id, kind, enrollment_id, material_submission_id,
    actor_id, note, previous_value, new_value
  )
  values (
    submission.organization_id,
    'assignment',
    v_enrollment,
    submission.id,
    caller,
    nullif(btrim(v_feedback), ''),
    v_prev,
    v_next
  );

  perform private.notify_published_grade(
    submission.organization_id,
    submission.student_profile_id,
    'material_grade',
    caller,
    coalesce(nullif(btrim(material.title), ''), 'Material'),
    left(
      coalesce(v_student_name, 'Student')
        || ' · '
        || case
          when v_points is null then 'Feedback'
          else v_points::text || '/' || v_possible::text
        end,
      160
    ),
    coalesce(v_course_title, ''),
    null,
    v_enrollment,
    submission.id
  );
end;
$$;

revoke all on function public.grade_material_submission(bigint, numeric, text)
  from public, anon;
grant execute on function public.grade_material_submission(bigint, numeric, text)
  to authenticated, service_role;

comment on function public.grade_material_submission(bigint, numeric, text) is
  'Teacher grade for one material submission. Gradable materials store points. Others store feedback only and stay out of the gradebook.';

-- ---------------------------------------------------------------------------
-- Gradebook rows: locked quizzes plus graded gradable materials
-- ---------------------------------------------------------------------------

create or replace function private.enrollment_material_rows(p_enrollment_id bigint)
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
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'kind', 'material',
        'material_id', m.id,
        'unit_id', m.unit_id,
        'submission_id', s.id,
        'title', m.title,
        'locked', (
          s.graded_at is not null
          and coalesce(s.points_possible, 0) > 0
        ),
        'earned', s.points_earned,
        'possible', s.points_possible,
        'percent', case
          when s.graded_at is not null and coalesce(s.points_possible, 0) > 0
          then round((s.points_earned / s.points_possible) * 100, 2)
          else null
        end
      )
      order by m.title, m.id
    ),
    '[]'::jsonb
  )
  from enrollment e
  join public.materials m
    on m.course_id = e.course_id
   and m.deleted_at is null
   and m.accept_submissions
   and m.gradable
  join public.material_submissions s
    on s.material_id = m.id
   and s.student_profile_id = e.student_profile_id
   and s.deleted_at is null
  where exists (
    select 1
    from public.material_submission_versions v
    where v.submission_id = s.id
  );
$$;

create or replace function private.enrollment_grade_rows(p_enrollment_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.enrollment_quiz_rows(p_enrollment_id)
    || private.enrollment_material_rows(p_enrollment_id);
$$;

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
          'items', private.enrollment_grade_rows(e.id),
          'final_percent', private.mean_locked_percent(private.enrollment_grade_rows(e.id)),
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
        'items', private.enrollment_grade_rows(e.id),
        'final_percent', private.mean_locked_percent(private.enrollment_grade_rows(e.id)),
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

  v_items := private.enrollment_grade_rows(p_enrollment_id);
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

-- ---------------------------------------------------------------------------
-- Activity for a saved material grade or feedback
-- ---------------------------------------------------------------------------

drop function if exists private.notify_published_grade(
  bigint, bigint, text, uuid, text, text, text, bigint, bigint
);

create or replace function private.notify_published_grade(
  p_organization_id bigint,
  p_student_profile_id bigint,
  p_kind text,
  p_actor uuid,
  p_title text,
  p_preview text,
  p_audience text,
  p_quiz_attempt_id bigint,
  p_enrollment_id bigint,
  p_material_submission_id bigint default null
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
  if p_kind = 'material_grade' and p_material_submission_id is null then
    return;
  end if;
  if p_kind not in ('quiz_grade', 'course_final', 'material_grade') then
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
    elsif p_kind = 'material_grade' then
      insert into public.notifications (
        organization_id, user_id, kind, actor_id, title, preview, audience_label,
        student_profile_id, enrollment_id, material_submission_id
      )
      values (
        p_organization_id, recipient.user_id, 'material_grade', p_actor,
        p_title, coalesce(p_preview, ''), coalesce(p_audience, ''),
        p_student_profile_id, p_enrollment_id, p_material_submission_id
      )
      on conflict (user_id, material_submission_id)
        where kind = 'material_grade' and material_submission_id is not null
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
  bigint, bigint, text, uuid, text, text, text, bigint, bigint, bigint
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
     or new.material_submission_id is distinct from old.material_submission_id
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
