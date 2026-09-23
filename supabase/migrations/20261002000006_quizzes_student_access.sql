-- Let student accounts see and turn in published course quizzes.
-- Quizzes shipped with parent_can_view_course only; materials already include
-- student_can_view_course. Same gap blocked submit and reading own attempts.

create or replace function private.can_view_quiz(p_quiz_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quizzes q
    where q.id = p_quiz_id
      and q.deleted_at is null
      and (
        (select private.is_org_staff(q.organization_id))
        or (
          q.visibility = 'published'
          and (
            (select private.parent_can_view_course(q.course_id))
            or (select private.student_can_view_course(q.course_id))
          )
        )
      )
  );
$$;

create or replace function private.caller_is_student_on_course(p_course_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.student_profiles sp on sp.id = e.student_profile_id
    join public.parent_student_links psl
      on psl.student_profile_id = sp.id
     and psl.parent_user_id = (select auth.uid())
    join public.profiles p on p.id = psl.parent_user_id
    where e.course_id = p_course_id
      and e.status = 'active'
      and sp.student_email is not null
      and lower(btrim(sp.student_email)) = lower(btrim(p.email))
  )
  or exists (
    select 1
    from public.enrollments e
    join public.student_profiles sp
      on sp.id = e.student_profile_id
     and sp.user_id = (select auth.uid())
    where e.course_id = p_course_id
      and e.status = 'active'
  );
$$;

create or replace function private.can_read_quiz_attempt(p_attempt_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quiz_attempts a
    join public.quizzes q on q.id = a.quiz_id
    where a.id = p_attempt_id
      and q.deleted_at is null
      and (
        (select private.can_manage_course(q.course_id))
        or (
          (
            (select private.parent_linked_to_student(a.student_profile_id))
            or (select private.student_owns_profile(a.student_profile_id))
          )
          and q.visibility = 'published'
          and (
            (select private.parent_can_view_course(q.course_id))
            or (select private.student_can_view_course(q.course_id))
          )
        )
      )
  );
$$;

drop policy if exists quizzes_select on public.quizzes;
create policy quizzes_select on public.quizzes
for select to authenticated
using (
  deleted_at is null
  and (
    (select private.is_org_staff(organization_id))
    or (
      visibility = 'published'
      and (
        (select private.parent_can_view_course(course_id))
        or (select private.student_can_view_course(course_id))
      )
    )
  )
);

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
  v_score int := 0;
  v_score_total int := 0;
  answer jsonb;
  selected_ids bigint[];
  correct_ids bigint[];
  raw_count int;
  live_count int;
  pick_count int;
  summary text;
  short_text text;
  key_text text;
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

    if question.kind = 'multiple_choice' then
      select coalesce(array_agg(distinct (elem)::bigint order by (elem)::bigint), '{}')
        into selected_ids
      from jsonb_array_elements_text(coalesce(answer->'choiceIds', '[]'::jsonb)) elem
      where elem ~ '^[0-9]+$';

      select count(*) into raw_count from unnest(selected_ids);
      select count(*) into live_count
      from public.quiz_choices c
      where c.question_id = question.id
        and c.deleted_at is null
        and c.id = any(selected_ids);

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
        if coalesce(cardinality(correct_ids), 0) > 0 then
          v_score_total := v_score_total + 1;
          if raw_count = live_count and selected_ids = correct_ids then
            v_score := v_score + 1;
          end if;
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
          v_score_total := v_score_total + 1;
          if private.quiz_number_value(short_text) = private.quiz_number_value(key_text) then
            v_score := v_score + 1;
          end if;
        end if;
      end if;
    elsif question.kind = 'matching' then
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
        select count(*) into live_count
        from public.quiz_match_keys k
        join public.quiz_match_prompts p on p.id = k.prompt_id
        join public.quiz_match_options o on o.id = k.option_id
        where k.question_id = question.id
          and p.deleted_at is null
          and o.deleted_at is null
          and btrim(p.text) <> ''
          and btrim(o.text) <> '';
        select count(*) into pick_count
        from jsonb_array_elements(coalesce(answer->'matches', '[]'::jsonb)) elem
        where (elem->>'leftId') ~ '^[0-9]+$'
          and (elem->>'rightId') ~ '^[0-9]+$'
          and exists (
            select 1
            from public.quiz_match_keys k
            join public.quiz_match_prompts p on p.id = k.prompt_id
            join public.quiz_match_options o on o.id = k.option_id
            where k.question_id = question.id
              and k.prompt_id = (elem->>'leftId')::bigint
              and p.deleted_at is null
              and o.deleted_at is null
              and btrim(p.text) <> ''
              and btrim(o.text) <> ''
          );
        if live_count > 0 then
          v_score_total := v_score_total + 1;
          if pick_count = live_count and not exists (
            select 1
            from public.quiz_match_keys k
            join public.quiz_match_prompts p on p.id = k.prompt_id
            join public.quiz_match_options o on o.id = k.option_id
            where k.question_id = question.id
              and p.deleted_at is null
              and o.deleted_at is null
              and btrim(p.text) <> ''
              and btrim(o.text) <> ''
              and not exists (
                select 1
                from jsonb_array_elements(coalesce(answer->'matches', '[]'::jsonb)) elem
                where (elem->>'leftId') ~ '^[0-9]+$'
                  and (elem->>'rightId') ~ '^[0-9]+$'
                  and (elem->>'leftId')::bigint = k.prompt_id
                  and (elem->>'rightId')::bigint = k.option_id
              )
          ) then
            v_score := v_score + 1;
          end if;
        end if;
      end if;
    elsif question.kind in ('short_answer', 'long_answer') then
      summary := short_text;
    elsif short_text <> '' then
      summary := short_text;
    end if;

    insert into public.quiz_attempt_answers (
      attempt_id,
      question_id,
      choice_ids,
      answer_text,
      prompt_snapshot,
      selected_summary
    ) values (
      attempt_id,
      question.id,
      case when question.kind = 'multiple_choice' then selected_ids else '{}' end,
      case
        when question.kind in ('short_answer', 'long_answer', 'number') then short_text
        else ''
      end,
      question.prompt,
      summary
    );
  end loop;

  if autograded then
    update public.quiz_attempts
    set autograded = true,
        score = v_score,
        score_total = v_score_total
    where id = attempt_id;
  end if;

  return jsonb_build_object(
    'attemptId', attempt_id,
    'autograded', autograded,
    'score', case when autograded then v_score else null end,
    'scoreTotal', case when autograded then v_score_total else null end
  );
end;
$$;


revoke all on function public.submit_quiz_attempt(bigint, bigint, jsonb) from public, anon;
grant execute on function public.submit_quiz_attempt(bigint, bigint, jsonb)
  to authenticated, service_role;
