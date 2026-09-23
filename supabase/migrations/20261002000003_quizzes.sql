-- Course quizzes families take in the app or print.
-- Not a material, and not a material_submissions file turn-in.

create table public.quizzes (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  course_id bigint not null references public.courses (id) on delete cascade,
  unit_id bigint references public.units (id) on delete cascade,
  title text not null,
  description text not null default '',
  position int not null default 0,
  visibility text not null default 'unpublished',
  accepts_from timestamptz,
  accepts_until timestamptz,
  accepts_timezone text,
  allow_multiple_attempts boolean not null default false,
  autograde_and_show boolean not null default false,
  share_answer_key_with_parents boolean not null default false,
  copied_from_id bigint references public.quizzes (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  constraint quizzes_visibility_chk check (visibility in ('published', 'unpublished')),
  constraint quizzes_title_chk check (char_length(btrim(title)) > 0),
  constraint quizzes_window_chk check (
    accepts_from is null
    or accepts_until is null
    or accepts_until > accepts_from
  )
);

create index quizzes_organization_id_idx on public.quizzes (organization_id);
create index quizzes_course_id_idx on public.quizzes (course_id) where deleted_at is null;
create index quizzes_unit_id_idx on public.quizzes (unit_id) where deleted_at is null;
create index quizzes_copied_from_id_idx on public.quizzes (copied_from_id);
create index quizzes_created_by_idx on public.quizzes (created_by);

create trigger quizzes_set_updated_at
before update on public.quizzes
for each row execute function private.set_updated_at();

comment on table public.quizzes is
  'Course quiz. Take in the app when an accepting window is set; otherwise print. Not a material submission.';

create or replace function private.quizzes_in_scope()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  course_org bigint;
  unit_course bigint;
begin
  select c.organization_id into course_org
  from public.courses c
  where c.id = new.course_id;
  if course_org is null or course_org is distinct from new.organization_id then
    raise exception 'That quiz needs to stay on its course.' using errcode = '23514';
  end if;
  if new.unit_id is not null then
    select u.course_id into unit_course
    from public.units u
    where u.id = new.unit_id
      and u.deleted_at is null;
    if unit_course is distinct from new.course_id then
      raise exception 'That unit is not on this course.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger quizzes_in_scope
before insert or update of organization_id, course_id, unit_id on public.quizzes
for each row execute function private.quizzes_in_scope();

create table public.quiz_questions (
  id bigserial primary key,
  quiz_id bigint not null references public.quizzes (id) on delete cascade,
  position int not null default 0,
  prompt text not null default '',
  kind text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_questions_kind_chk check (kind in ('multiple_choice', 'short_answer'))
);

create index quiz_questions_quiz_id_idx
  on public.quiz_questions (quiz_id, position)
  where deleted_at is null;

create trigger quiz_questions_set_updated_at
before update on public.quiz_questions
for each row execute function private.set_updated_at();

comment on table public.quiz_questions is
  'Quiz question. Correct answers live in quiz_answer_keys, not on this row.';

create table public.quiz_choices (
  id bigserial primary key,
  question_id bigint not null references public.quiz_questions (id) on delete cascade,
  position int not null default 0,
  text text not null default '',
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index quiz_choices_question_id_idx
  on public.quiz_choices (question_id, position)
  where deleted_at is null;

comment on table public.quiz_choices is
  'Multiple-choice option. The correct flag is not stored here.';

create table public.quiz_answer_keys (
  id bigserial primary key,
  question_id bigint not null references public.quiz_questions (id) on delete cascade,
  choice_id bigint references public.quiz_choices (id) on delete cascade,
  answer_text text,
  constraint quiz_answer_keys_shape_chk check (
    (choice_id is not null and answer_text is null)
    or (choice_id is null and answer_text is not null)
  )
);

create unique index quiz_answer_keys_choice_idx
  on public.quiz_answer_keys (choice_id)
  where choice_id is not null;
create unique index quiz_answer_keys_short_idx
  on public.quiz_answer_keys (question_id)
  where choice_id is null;
create index quiz_answer_keys_question_id_idx on public.quiz_answer_keys (question_id);

comment on table public.quiz_answer_keys is
  'Correct choice or short-answer text. Hidden from student logins.';

create table public.quiz_attempts (
  id bigserial primary key,
  quiz_id bigint not null references public.quizzes (id) on delete cascade,
  student_profile_id bigint not null references public.student_profiles (id) on delete cascade,
  submitted_by uuid not null references public.profiles (id) on delete restrict,
  submitted_at timestamptz not null default now(),
  autograded boolean not null,
  score int,
  score_total int,
  constraint quiz_attempts_score_chk check (
    (autograded = false and score is null and score_total is null)
    or (
      autograded = true
      and score is not null
      and score_total is not null
      and score >= 0
      and score_total >= 0
      and score <= score_total
    )
  )
);

create index quiz_attempts_quiz_student_idx
  on public.quiz_attempts (quiz_id, student_profile_id, submitted_at desc);
create index quiz_attempts_submitted_by_idx on public.quiz_attempts (submitted_by);
create index quiz_attempts_student_profile_id_idx on public.quiz_attempts (student_profile_id);

comment on table public.quiz_attempts is
  'One submitted quiz entry. Score is frozen at submit time.';

create table public.quiz_attempt_answers (
  id bigserial primary key,
  attempt_id bigint not null references public.quiz_attempts (id) on delete cascade,
  question_id bigint not null references public.quiz_questions (id) on delete cascade,
  choice_ids bigint[] not null default '{}',
  answer_text text not null default '',
  prompt_snapshot text not null default '',
  selected_summary text not null default '',
  constraint quiz_attempt_answers_attempt_question_key unique (attempt_id, question_id)
);

create index quiz_attempt_answers_question_id_idx
  on public.quiz_attempt_answers (question_id);

comment on table public.quiz_attempt_answers is
  'Answers for one attempt, with the prompt and selection copied at submit time.';

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------

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

create or replace function private.can_read_quiz_answer_key(p_quiz_id bigint)
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
        (select private.can_manage_course(q.course_id))
        or (
          q.share_answer_key_with_parents
          and q.visibility = 'published'
          and (select private.parent_can_view_course(q.course_id))
          and not (select private.caller_is_student_on_course(q.course_id))
        )
      )
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

revoke all on function private.can_view_quiz(bigint) from public, anon;
revoke all on function private.caller_is_student_on_course(bigint) from public, anon;
revoke all on function private.can_read_quiz_answer_key(bigint) from public, anon;
revoke all on function private.can_read_quiz_attempt(bigint) from public, anon;
grant execute on function private.can_view_quiz(bigint) to authenticated, service_role;
grant execute on function private.caller_is_student_on_course(bigint) to authenticated, service_role;
grant execute on function private.can_read_quiz_answer_key(bigint) to authenticated, service_role;
grant execute on function private.can_read_quiz_attempt(bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Submit
-- ---------------------------------------------------------------------------

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
  summary text;
  short_text text;
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
      case when question.kind = 'short_answer' then short_text else '' end,
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
grant execute on function public.submit_quiz_attempt(bigint, bigint, jsonb) to authenticated;

comment on function public.submit_quiz_attempt(bigint, bigint, jsonb) is
  'Record one quiz entry during the accepting window. Scores multiple choice only when the quiz says to.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

grant select, insert, update on table public.quizzes to authenticated;
grant select, insert, update on table public.quiz_questions to authenticated;
grant select, insert, update on table public.quiz_choices to authenticated;
grant select, insert, update, delete on table public.quiz_answer_keys to authenticated;
grant select on table public.quiz_attempts to authenticated;
grant select on table public.quiz_attempt_answers to authenticated;

grant select, insert, update, delete on table public.quizzes to service_role;
grant select, insert, update, delete on table public.quiz_questions to service_role;
grant select, insert, update, delete on table public.quiz_choices to service_role;
grant select, insert, update, delete on table public.quiz_answer_keys to service_role;
grant select, insert, update, delete on table public.quiz_attempts to service_role;
grant select, insert, update, delete on table public.quiz_attempt_answers to service_role;

grant usage, select on sequence public.quizzes_id_seq to authenticated, service_role;
grant usage, select on sequence public.quiz_questions_id_seq to authenticated, service_role;
grant usage, select on sequence public.quiz_choices_id_seq to authenticated, service_role;
grant usage, select on sequence public.quiz_answer_keys_id_seq to authenticated, service_role;
grant usage, select on sequence public.quiz_attempts_id_seq to authenticated, service_role;
grant usage, select on sequence public.quiz_attempt_answers_id_seq to authenticated, service_role;

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_choices enable row level security;
alter table public.quiz_answer_keys enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;

create policy quizzes_select on public.quizzes
for select to authenticated
using (
  deleted_at is null
  and (
    (select private.is_org_staff(organization_id))
    or (
      visibility = 'published'
      and (select private.parent_can_view_course(course_id))
    )
  )
);

create policy quizzes_insert on public.quizzes
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_course(course_id))
);

create policy quizzes_update on public.quizzes
for update to authenticated
using ((select private.can_manage_course(course_id)))
with check ((select private.can_manage_course(course_id)));

create policy quiz_questions_select on public.quiz_questions
for select to authenticated
using (deleted_at is null and (select private.can_view_quiz(quiz_id)));

create policy quiz_questions_insert on public.quiz_questions
for insert to authenticated
with check (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_id
      and q.deleted_at is null
      and (select private.can_manage_course(q.course_id))
  )
);

create policy quiz_questions_update on public.quiz_questions
for update to authenticated
using (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_id
      and (select private.can_manage_course(q.course_id))
  )
)
with check (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_id
      and (select private.can_manage_course(q.course_id))
  )
);

create policy quiz_choices_select on public.quiz_choices
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

create policy quiz_choices_insert on public.quiz_choices
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

create policy quiz_choices_update on public.quiz_choices
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

create policy quiz_answer_keys_select on public.quiz_answer_keys
for select to authenticated
using (
  exists (
    select 1
    from public.quiz_questions qq
    where qq.id = question_id
      and (select private.can_read_quiz_answer_key(qq.quiz_id))
  )
);

create policy quiz_answer_keys_insert on public.quiz_answer_keys
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

create policy quiz_answer_keys_update on public.quiz_answer_keys
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

create policy quiz_answer_keys_delete on public.quiz_answer_keys
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

create policy quiz_attempts_select on public.quiz_attempts
for select to authenticated
using ((select private.can_read_quiz_attempt(id)));

create policy quiz_attempt_answers_select on public.quiz_attempt_answers
for select to authenticated
using ((select private.can_read_quiz_attempt(attempt_id)));
