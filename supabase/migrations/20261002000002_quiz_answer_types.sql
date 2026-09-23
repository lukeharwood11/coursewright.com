-- Number, matching, and long-answer questions on a course quiz.
-- Page quiz blocks stay multiple choice and short answer.

alter table public.quiz_questions
  drop constraint quiz_questions_kind_chk;

alter table public.quiz_questions
  add column answer_lines int;

alter table public.quiz_questions
  add constraint quiz_questions_kind_chk
  check (kind in ('multiple_choice', 'short_answer', 'number', 'matching', 'long_answer'));

alter table public.quiz_questions
  add constraint quiz_questions_answer_lines_chk
  check (
    (kind = 'long_answer' and answer_lines between 1 and 20)
    or (kind <> 'long_answer' and answer_lines is null)
  );

comment on column public.quiz_questions.answer_lines is
  'Blank lines to print for a long answer. Null for every other kind.';

create table public.quiz_match_prompts (
  id bigserial primary key,
  question_id bigint not null references public.quiz_questions (id) on delete cascade,
  position int not null default 0,
  text text not null default '',
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.quiz_match_options (
  id bigserial primary key,
  question_id bigint not null references public.quiz_questions (id) on delete cascade,
  position int not null default 0,
  text text not null default '',
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index quiz_match_prompts_question_id_idx
  on public.quiz_match_prompts (question_id, position)
  where deleted_at is null;

create index quiz_match_options_question_id_idx
  on public.quiz_match_options (question_id, position)
  where deleted_at is null;

comment on table public.quiz_match_prompts is
  'Left column of a matching question. Visible with the quiz. The correct option is not stored here.';

comment on table public.quiz_match_options is
  'Right column of a matching question. Visible with the quiz. Display order is mixed; this position is the saved order.';

create table public.quiz_match_keys (
  id bigserial primary key,
  question_id bigint not null references public.quiz_questions (id) on delete cascade,
  prompt_id bigint not null references public.quiz_match_prompts (id) on delete cascade,
  option_id bigint not null references public.quiz_match_options (id) on delete cascade,
  unique (prompt_id),
  unique (option_id)
);

create index quiz_match_keys_question_id_idx on public.quiz_match_keys (question_id);

comment on table public.quiz_match_keys is
  'Which option matches which prompt. Hidden from student logins, same as quiz_answer_keys.';

create or replace function private.quiz_number_value(p_text text)
returns numeric
language plpgsql
immutable
set search_path = ''
as $$
declare
  raw text := btrim(coalesce(p_text, ''));
  slash int;
  numerator numeric;
  denominator numeric;
begin
  if raw = '' or left(raw, 1) = '+' then
    raw := btrim(case when left(raw, 1) = '+' then substring(raw from 2) else raw end);
  end if;
  if raw = '' then
    return null;
  end if;
  if raw ~ '^-?[0-9]+/[0-9]+$' then
    slash := strpos(raw, '/');
    numerator := substring(raw from 1 for slash - 1)::numeric;
    denominator := substring(raw from slash + 1)::numeric;
    if denominator = 0 then
      return null;
    end if;
    return numerator / denominator;
  end if;
  if raw ~ '^-?([0-9]+(\.[0-9]+)?|\.[0-9]+)$' then
    return raw::numeric;
  end if;
  return null;
end;
$$;

revoke all on function private.quiz_number_value(text) from public, anon;
grant execute on function private.quiz_number_value(text) to authenticated, service_role;

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
  score int := 0;
  score_total int := 0;
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
  if not private.parent_can_view_course(quiz.course_id) then
    raise exception 'You can’t turn in this quiz.' using errcode = '42501';
  end if;
  if not private.parent_linked_to_student(p_student_profile_id) then
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
        chr(64 + ranked.n)::text || '. ' || ranked.text,
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
          score_total := score_total + 1;
          if raw_count = live_count and selected_ids = correct_ids then
            score := score + 1;
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
          score_total := score_total + 1;
          if private.quiz_number_value(short_text) = private.quiz_number_value(key_text) then
            score := score + 1;
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
          score_total := score_total + 1;
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
            score := score + 1;
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
        score = score,
        score_total = score_total
    where id = attempt_id;
  end if;

  return jsonb_build_object(
    'attemptId', attempt_id,
    'autograded', autograded,
    'score', case when autograded then score else null end,
    'scoreTotal', case when autograded then score_total else null end
  );
end;
$$;

comment on function public.submit_quiz_attempt(bigint, bigint, jsonb) is
  'Record one quiz entry during the accepting window. Scores multiple choice, number, and matching when the quiz says to.';

grant select, insert, update on table public.quiz_match_prompts to authenticated;
grant select, insert, update on table public.quiz_match_options to authenticated;
grant select, insert, update, delete on table public.quiz_match_keys to authenticated;
grant select, insert, update, delete on table public.quiz_match_prompts to service_role;
grant select, insert, update, delete on table public.quiz_match_options to service_role;
grant select, insert, update, delete on table public.quiz_match_keys to service_role;
grant usage, select on sequence public.quiz_match_prompts_id_seq to authenticated, service_role;
grant usage, select on sequence public.quiz_match_options_id_seq to authenticated, service_role;
grant usage, select on sequence public.quiz_match_keys_id_seq to authenticated, service_role;

alter table public.quiz_match_prompts enable row level security;
alter table public.quiz_match_options enable row level security;
alter table public.quiz_match_keys enable row level security;

create policy quiz_match_prompts_select on public.quiz_match_prompts
for select to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.quiz_questions qq
    where qq.id = question_id
      and qq.deleted_at is null
      and (select private.can_view_quiz(qq.quiz_id))
  )
);

create policy quiz_match_options_select on public.quiz_match_options
for select to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.quiz_questions qq
    where qq.id = question_id
      and qq.deleted_at is null
      and (select private.can_view_quiz(qq.quiz_id))
  )
);

create policy quiz_match_prompts_insert on public.quiz_match_prompts
for insert to authenticated
with check (
  exists (
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id
      and q.deleted_at is null
      and (select private.can_manage_course(q.course_id))
  )
);

create policy quiz_match_options_insert on public.quiz_match_options
for insert to authenticated
with check (
  exists (
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id
      and q.deleted_at is null
      and (select private.can_manage_course(q.course_id))
  )
);

create policy quiz_match_prompts_update on public.quiz_match_prompts
for update to authenticated
using (
  exists (
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id
      and (select private.can_manage_course(q.course_id))
  )
)
with check (
  exists (
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id
      and (select private.can_manage_course(q.course_id))
  )
);

create policy quiz_match_options_update on public.quiz_match_options
for update to authenticated
using (
  exists (
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id
      and (select private.can_manage_course(q.course_id))
  )
)
with check (
  exists (
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id
      and (select private.can_manage_course(q.course_id))
  )
);

create policy quiz_match_keys_select on public.quiz_match_keys
for select to authenticated
using (
  exists (
    select 1
    from public.quiz_questions qq
    where qq.id = question_id
      and (select private.can_read_quiz_answer_key(qq.quiz_id))
  )
);

create policy quiz_match_keys_insert on public.quiz_match_keys
for insert to authenticated
with check (
  exists (
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id
      and (select private.can_manage_course(q.course_id))
  )
);

create policy quiz_match_keys_update on public.quiz_match_keys
for update to authenticated
using (
  exists (
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id
      and (select private.can_manage_course(q.course_id))
  )
)
with check (
  exists (
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id
      and (select private.can_manage_course(q.course_id))
  )
);

create policy quiz_match_keys_delete on public.quiz_match_keys
for delete to authenticated
using (
  exists (
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id
      and (select private.can_manage_course(q.course_id))
  )
);
