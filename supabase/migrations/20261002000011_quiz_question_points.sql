-- Each question has possible points (default 1). Autograde fills a first pass.
-- A teacher grade overwrites those points and is stored separately.

alter table public.quiz_questions
  add column if not exists points numeric(8,2) not null default 1;

alter table public.quiz_questions
  drop constraint if exists quiz_questions_points_chk;

alter table public.quiz_questions
  add constraint quiz_questions_points_chk check (points > 0);

comment on column public.quiz_questions.points is
  'Possible points for this question. Default 1. Snapshotted onto each attempt answer.';

alter table public.quiz_attempt_answers
  add column if not exists points_possible numeric(8,2),
  add column if not exists auto_points numeric(8,2),
  add column if not exists teacher_points numeric(8,2);

comment on column public.quiz_attempt_answers.points_possible is
  'Possible points copied from the question when the entry was submitted.';
comment on column public.quiz_attempt_answers.auto_points is
  'Points from the autograder. Null when that question was not autograded.';
comment on column public.quiz_attempt_answers.teacher_points is
  'Points a teacher saved. When set, these replace auto_points for the score.';

alter table public.quiz_attempts
  add column if not exists teacher_graded_at timestamptz,
  add column if not exists graded_by uuid references public.profiles (id) on delete set null;

comment on column public.quiz_attempts.teacher_graded_at is
  'When a teacher saved a grade. Null means the autograde, if any, has not been verified.';
comment on column public.quiz_attempts.autograded is
  'True when autograde filled a first pass. Stays true after a teacher overwrites the points.';

alter table public.quiz_attempts
  drop constraint if exists quiz_attempts_score_chk;

alter table public.quiz_attempts
  alter column score type numeric(10,2) using score::numeric(10,2),
  alter column score_total type numeric(10,2) using score_total::numeric(10,2);

alter table public.quiz_attempts
  add constraint quiz_attempts_score_chk check (
    (score is null and score_total is null)
    or (
      score is not null
      and score_total is not null
      and score >= 0
      and score_total >= 0
      and score <= score_total
    )
  );

-- Existing autograded answers were 1 point or 0. Essays stay unscored.
update public.quiz_attempt_answers as answer
set
  points_possible = coalesce(answer.points_possible, 1),
  auto_points = case
    when attempt.autograded and answer.is_correct is true then 1
    when attempt.autograded and answer.is_correct is false then 0
    else answer.auto_points
  end
from public.quiz_attempts as attempt
where attempt.id = answer.attempt_id
  and answer.points_possible is null;

create or replace function private.quiz_awarded_points(
  p_points numeric,
  p_hits int,
  p_total int,
  p_misses int
)
returns numeric
language sql
immutable
as $$
  select case
    when p_total is null or p_total <= 0 then null
    when p_hits >= p_total and p_misses <= 0 then round(p_points, 2)
    else greatest(0, round(p_points * (p_hits - p_misses)::numeric / p_total, 2))
  end;
$$;

comment on function private.quiz_awarded_points(numeric, int, int, int) is
  'Equal shares of p_points. Misses subtract a share (multiple choice). Pass 0 misses for matching.';

create or replace function public.submit_quiz_attempt(
  p_quiz_id bigint,
  p_student_profile_id bigint,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  quiz public.quizzes%rowtype;
  question public.quiz_questions%rowtype;
  attempt_id bigint;
  autograded boolean;
  v_score numeric := 0;
  v_score_total numeric := 0;
  v_pending boolean := false;
  answer jsonb;
  selected_ids bigint[];
  correct_ids bigint[];
  v_hits int;
  v_misses int;
  v_parts int;
  summary text;
  short_text text;
  key_text text;
  v_auto_points numeric;
  v_match_pairs jsonb;
begin
  if caller is null then
    raise exception 'Sign in to turn in this quiz.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'Those answers could not be read.' using errcode = 'P0001';
  end if;

  select * into quiz
  from public.quizzes
  where id = p_quiz_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'We couldn’t find that quiz.' using errcode = 'P0002';
  end if;
  if quiz.visibility is distinct from 'published' then
    raise exception 'This quiz is not open yet.' using errcode = '42501';
  end if;
  if not (
    private.parent_can_view_course(quiz.course_id)
    or private.student_can_view_course(quiz.course_id)
  ) then
    raise exception 'You can’t turn in this quiz.' using errcode = '42501';
  end if;
  if not (
    private.parent_linked_to_student(p_student_profile_id)
    or private.student_owns_profile(p_student_profile_id)
  ) then
    raise exception 'Choose a student you are linked to.' using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.enrollments e
    where e.student_profile_id = p_student_profile_id
      and e.course_id = quiz.course_id
      and e.status = 'active'
  ) then
    raise exception 'That student is not in this course.' using errcode = '42501';
  end if;
  if quiz.accepts_from is null and quiz.accepts_until is null then
    raise exception 'This quiz is for printing, not turning in here.' using errcode = 'P0001';
  end if;
  if quiz.accepts_from is not null and now() < quiz.accepts_from then
    raise exception 'This quiz is not accepting entries yet.' using errcode = 'P0001';
  end if;
  if quiz.accepts_until is not null and now() >= quiz.accepts_until then
    raise exception 'This quiz is no longer accepting entries.' using errcode = 'P0001';
  end if;
  if not quiz.allow_multiple_attempts and exists (
    select 1
    from public.quiz_attempts a
    where a.quiz_id = quiz.id
      and a.student_profile_id = p_student_profile_id
  ) then
    raise exception 'This quiz already has an entry for that student.' using errcode = 'P0001';
  end if;

  autograded := quiz.autograde_and_show;

  insert into public.quiz_attempts (
    quiz_id,
    student_profile_id,
    submitted_by,
    submitted_at,
    autograded,
    score,
    score_total
  ) values (
    quiz.id,
    p_student_profile_id,
    caller,
    now(),
    false,
    null,
    null
  )
  returning id into attempt_id;

  for question in
    select *
    from public.quiz_questions
    where quiz_id = quiz.id
      and deleted_at is null
    order by position, id
  loop
    select ans into answer
    from jsonb_array_elements(p_answers) ans
    where (ans->>'questionId')::bigint = question.id
    limit 1;

    short_text := left(btrim(coalesce(answer->>'text', '')), 4000);
    selected_ids := '{}';
    summary := '';
    key_text := null;
    v_auto_points := null;
    v_match_pairs := '[]'::jsonb;
    v_score_total := v_score_total + question.points;

    if question.kind = 'multiple_choice' then
      select coalesce(array_agg(distinct (elem)::bigint order by (elem)::bigint), '{}')
        into selected_ids
      from jsonb_array_elements_text(coalesce(answer->'choiceIds', '[]'::jsonb)) elem
      where elem ~ '^[0-9]+$';

      select coalesce(string_agg(
        chr(64 + ranked.n::integer)::text || '. ' || ranked.text,
        ', ' order by ranked.n
      ), '')
        into summary
      from (
        select c.id, c.text, row_number() over (order by c.position, c.id) as n
        from public.quiz_choices c
        where c.question_id = question.id
          and c.deleted_at is null
          and btrim(c.text) <> ''
      ) ranked
      where ranked.id = any(selected_ids);

      if autograded then
        select coalesce(array_agg(k.choice_id order by k.choice_id), '{}')
          into correct_ids
        from public.quiz_answer_keys k
        join public.quiz_choices c on c.id = k.choice_id
        where k.question_id = question.id
          and k.choice_id is not null
          and c.deleted_at is null
          and btrim(c.text) <> '';
        v_parts := coalesce(cardinality(correct_ids), 0);
        if v_parts > 0 then
          select count(*) into v_hits
          from unnest(correct_ids) as cid
          where cid = any(selected_ids);
          select count(*) into v_misses
          from public.quiz_choices c
          where c.question_id = question.id
            and c.deleted_at is null
            and btrim(c.text) <> ''
            and c.id = any(selected_ids)
            and not (c.id = any(correct_ids));
          v_auto_points := private.quiz_awarded_points(question.points, v_hits, v_parts, v_misses);
        end if;
      end if;
    elsif question.kind = 'number' then
      summary := short_text;
      if autograded then
        select k.answer_text into key_text
        from public.quiz_answer_keys k
        where k.question_id = question.id
          and k.choice_id is null
        limit 1;
        if private.quiz_number_value(key_text) is not null then
          v_auto_points := case
            when private.quiz_number_value(short_text)
              is not distinct from private.quiz_number_value(key_text)
            then question.points
            else 0
          end;
        end if;
      end if;
    elsif question.kind = 'matching' then
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'leftId', (elem->>'leftId')::bigint,
          'rightId', (elem->>'rightId')::bigint
        )
        order by (elem->>'leftId')::bigint
      ), '[]'::jsonb)
        into v_match_pairs
      from jsonb_array_elements(coalesce(answer->'matches', '[]'::jsonb)) elem
      where (elem->>'leftId') ~ '^[0-9]+$'
        and (elem->>'rightId') ~ '^[0-9]+$';

      select coalesce(string_agg(
        prompts.n::text || '. ' || prompts.prompt_text || ' — ' || coalesce(chosen.option_text, 'No answer'),
        '; ' order by prompts.n
      ), '')
        into summary
      from (
        select
          id,
          btrim(text) as prompt_text,
          row_number() over (order by position, id) as n
        from public.quiz_match_prompts
        where question_id = question.id
          and deleted_at is null
          and btrim(text) <> ''
      ) prompts
      left join lateral (
        select (elem->>'rightId')::bigint as right_id
        from jsonb_array_elements(coalesce(answer->'matches', '[]'::jsonb)) elem
        where (elem->>'leftId') ~ '^[0-9]+$'
          and (elem->>'leftId')::bigint = prompts.id
          and (elem->>'rightId') ~ '^[0-9]+$'
        limit 1
      ) picked on true
      left join (
        select id, btrim(text) as option_text
        from public.quiz_match_options
        where question_id = question.id
          and deleted_at is null
      ) chosen on chosen.id = picked.right_id;

      if autograded then
        select count(*) into v_parts
        from public.quiz_match_keys k
        join public.quiz_match_prompts p on p.id = k.prompt_id
        join public.quiz_match_options o on o.id = k.option_id
        where k.question_id = question.id
          and p.deleted_at is null
          and o.deleted_at is null
          and btrim(p.text) <> ''
          and btrim(o.text) <> '';
        select count(*) into v_hits
        from public.quiz_match_keys k
        join public.quiz_match_prompts p on p.id = k.prompt_id
        join public.quiz_match_options o on o.id = k.option_id
        where k.question_id = question.id
          and p.deleted_at is null
          and o.deleted_at is null
          and btrim(p.text) <> ''
          and btrim(o.text) <> ''
          and exists (
            select 1
            from jsonb_array_elements(coalesce(answer->'matches', '[]'::jsonb)) elem
            where (elem->>'leftId') ~ '^[0-9]+$'
              and (elem->>'rightId') ~ '^[0-9]+$'
              and (elem->>'leftId')::bigint = k.prompt_id
              and (elem->>'rightId')::bigint = k.option_id
          );
        if v_parts > 0 then
          v_auto_points := private.quiz_awarded_points(question.points, v_hits, v_parts, 0);
        end if;
      end if;
    elsif question.kind in ('short_answer', 'long_answer') then
      summary := short_text;
    elsif short_text <> '' then
      summary := short_text;
    end if;

    if autograded and v_auto_points is not null then
      v_score := v_score + v_auto_points;
    elsif autograded then
      v_pending := true;
    end if;

    insert into public.quiz_attempt_answers (
      attempt_id,
      question_id,
      choice_ids,
      answer_text,
      prompt_snapshot,
      selected_summary,
      is_correct,
      match_pairs,
      points_possible,
      auto_points
    ) values (
      attempt_id,
      question.id,
      case when question.kind = 'multiple_choice' then selected_ids else '{}' end,
      case
        when question.kind in ('short_answer', 'long_answer', 'number') then short_text
        else ''
      end,
      question.prompt,
      summary,
      case
        when v_auto_points is null then null
        when v_auto_points = question.points then true
        else false
      end,
      case when question.kind = 'matching' then v_match_pairs else '[]'::jsonb end,
      question.points,
      v_auto_points
    );
  end loop;

  if not autograded then
    v_pending := true;
  end if;

  if autograded then
    update public.quiz_attempts
    set autograded = true,
        score = case when v_pending then null else v_score end,
        score_total = case when v_pending then null else v_score_total end
    where id = attempt_id;
  end if;

  return jsonb_build_object(
    'attemptId', attempt_id,
    'autograded', autograded,
    'score', case when autograded and not v_pending then to_jsonb(v_score::float8) else 'null'::jsonb end,
    'scoreTotal', case when autograded and not v_pending then to_jsonb(v_score_total::float8) else 'null'::jsonb end
  );
end;
$$;

revoke all on function public.submit_quiz_attempt(bigint, bigint, jsonb) from public, anon;
grant execute on function public.submit_quiz_attempt(bigint, bigint, jsonb)
  to authenticated, service_role;

comment on function public.submit_quiz_attempt(bigint, bigint, jsonb) is
  'Record one quiz entry. Autograde stores a first pass of points. The score is published only when every question has points.';

drop function if exists public.grade_quiz_attempt_answer(bigint, bigint, boolean);

create or replace function public.grade_quiz_attempt(
  p_attempt_id bigint,
  p_points jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  v_course_id bigint;
  v_answer_count int;
  v_given int;
  item jsonb;
  v_question_id bigint;
  v_points numeric;
  v_possible numeric;
begin
  if caller is null then
    raise exception 'Sign in to grade this quiz.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_points) is distinct from 'array' then
    raise exception 'Those points could not be read.' using errcode = 'P0001';
  end if;

  select q.course_id
  into v_course_id
  from public.quiz_attempts a
  join public.quizzes q on q.id = a.quiz_id
  where a.id = p_attempt_id;

  if v_course_id is null then
    raise exception 'That quiz entry was not found.' using errcode = 'P0002';
  end if;

  if not private.can_manage_course(v_course_id) then
    raise exception 'You cannot grade this quiz entry.' using errcode = '42501';
  end if;

  select count(*) into v_answer_count
  from public.quiz_attempt_answers
  where attempt_id = p_attempt_id;

  select count(*) into v_given
  from jsonb_array_elements(p_points);

  if v_given is distinct from v_answer_count or v_answer_count = 0 then
    raise exception 'Grade every question on this entry.' using errcode = 'P0001';
  end if;

  for item in
    select elem from jsonb_array_elements(p_points) elem
  loop
    if (item->>'questionId') !~ '^[0-9]+$' or (item->>'points') !~ '^[0-9]+(\.[0-9]{1,2})?$' then
      raise exception 'Enter points as a number, such as 4.5.' using errcode = 'P0001';
    end if;
    v_question_id := (item->>'questionId')::bigint;
    v_points := round((item->>'points')::numeric, 2);

    select points_possible into v_possible
    from public.quiz_attempt_answers
    where attempt_id = p_attempt_id
      and question_id = v_question_id;

    if v_possible is null then
      raise exception 'That answer was not found.' using errcode = 'P0002';
    end if;
    if v_points < 0 or v_points > v_possible then
      raise exception 'Points have to be between 0 and the points possible.' using errcode = 'P0001';
    end if;

    update public.quiz_attempt_answers
    set teacher_points = v_points,
        is_correct = (v_points = v_possible)
    where attempt_id = p_attempt_id
      and question_id = v_question_id;
  end loop;

  if exists (
    select 1
    from public.quiz_attempt_answers
    where attempt_id = p_attempt_id
      and teacher_points is null
  ) then
    raise exception 'Grade every question on this entry.' using errcode = 'P0001';
  end if;

  update public.quiz_attempts
  set score = (
        select coalesce(sum(teacher_points), 0)
        from public.quiz_attempt_answers
        where attempt_id = p_attempt_id
      ),
      score_total = (
        select coalesce(sum(points_possible), 0)
        from public.quiz_attempt_answers
        where attempt_id = p_attempt_id
      ),
      teacher_graded_at = now(),
      graded_by = caller
  where id = p_attempt_id;
end;
$$;

revoke all on function public.grade_quiz_attempt(bigint, jsonb) from public, anon;
grant execute on function public.grade_quiz_attempt(bigint, jsonb)
  to authenticated, service_role;

comment on function public.grade_quiz_attempt(bigint, jsonb) is
  'Save a teacher grade for every question on one entry. Autograded points stay on the answer for comparison.';
