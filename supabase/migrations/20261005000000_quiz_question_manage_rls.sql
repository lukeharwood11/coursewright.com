-- Quiz question writes must not re-read public.quizzes under quizzes_select.
--
-- This is older than the membership-role change. Before that migration,
-- quiz_questions_insert was already:
--   exists (
--     select 1 from quizzes q
--     where q.id = quiz_id and q.deleted_at is null
--       and can_manage_course(q.course_id)
--   )
-- The quizzes read is the caller's quizzes_select, not can_manage_course.
-- quizzes_select and the INSERT … RETURNING policy (can_view_quiz) both
-- require is_org_staff(quiz.organization_id) or a published family audience.
-- can_manage_course is is_org_admin(course.organization_id) or
-- is_course_instructor(course). Those are not the same check.
--
-- An active org owner is both is_org_admin and is_org_staff, so this shape
-- allows that insert. It still raises
-- "new row violates row-level security policy for table quiz_questions"
-- when the nested quizzes read or can_view_quiz is false while
-- can_manage_course is true (the parent row is hidden). The membership
-- migration did not change this insert policy.
--
-- can_manage_course stays: active org owner/admin (no course_instructors row
-- required) OR an assigned course instructor.

create or replace function private.can_manage_course(p_course_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.courses c
    where c.id = p_course_id
      and (
        private.is_org_admin(c.organization_id)
        or private.is_course_instructor(c.id)
      )
  );
$$;

comment on function private.can_manage_course(bigint) is
  'Active org owner or admin, or an assigned course instructor. Owner and admin do not need a course_instructors row.';

-- Live quiz the caller may edit. Security definer so the lookup ignores
-- quizzes_select.
create or replace function private.can_manage_quiz(p_quiz_id bigint)
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
      and (select private.can_manage_course(q.course_id))
  );
$$;

-- Live question on a live quiz the caller may edit. Security definer so the
-- lookup ignores quiz_questions and quizzes SELECT policies.
create or replace function private.can_manage_quiz_question(p_question_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = p_question_id
      and qq.deleted_at is null
      and q.deleted_at is null
      and (select private.can_manage_course(q.course_id))
  );
$$;

-- Read a non-deleted question when the caller may view the quiz or manage it.
-- Used by child-row SELECT (including INSERT … RETURNING) so those policies
-- do not scan quiz_questions under RLS.
create or replace function private.can_read_quiz_question_row(p_question_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quiz_questions qq
    where qq.id = p_question_id
      and qq.deleted_at is null
      and (
        (select private.can_view_quiz(qq.quiz_id))
        or (select private.can_manage_quiz(qq.quiz_id))
      )
  );
$$;

create or replace function private.can_read_question_answer_key(p_question_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quiz_questions qq
    where qq.id = p_question_id
      and (select private.can_read_quiz_answer_key(qq.quiz_id))
  );
$$;

revoke all on function private.can_manage_quiz(bigint) from public, anon;
revoke all on function private.can_manage_quiz_question(bigint) from public, anon;
revoke all on function private.can_read_quiz_question_row(bigint) from public, anon;
revoke all on function private.can_read_question_answer_key(bigint) from public, anon;

grant execute on function private.can_manage_quiz(bigint) to authenticated, service_role;
grant execute on function private.can_manage_quiz_question(bigint) to authenticated, service_role;
grant execute on function private.can_read_quiz_question_row(bigint) to authenticated, service_role;
grant execute on function private.can_read_question_answer_key(bigint) to authenticated, service_role;

comment on function private.can_manage_quiz(bigint) is
  'Caller may edit this live quiz. Does not depend on quizzes_select.';

comment on function private.can_manage_quiz_question(bigint) is
  'Caller may edit this live question. Does not depend on nested quiz or question SELECT policies.';

-- ---------------------------------------------------------------------------
-- quiz_questions
-- ---------------------------------------------------------------------------

drop policy if exists quiz_questions_select on public.quiz_questions;
create policy quiz_questions_select on public.quiz_questions
for select to authenticated
using (
  deleted_at is null
  and (
    (select private.can_view_quiz(quiz_id))
    or (select private.can_manage_quiz(quiz_id))
  )
);

drop policy if exists quiz_questions_insert on public.quiz_questions;
create policy quiz_questions_insert on public.quiz_questions
for insert to authenticated
with check ((select private.can_manage_quiz(quiz_id)));

drop policy if exists quiz_questions_update on public.quiz_questions;
create policy quiz_questions_update on public.quiz_questions
for update to authenticated
using ((select private.can_manage_quiz(quiz_id)))
with check ((select private.can_manage_quiz(quiz_id)));

-- ---------------------------------------------------------------------------
-- quiz_choices
-- ---------------------------------------------------------------------------

drop policy if exists quiz_choices_select on public.quiz_choices;
create policy quiz_choices_select on public.quiz_choices
for select to authenticated
using (
  deleted_at is null
  and (select private.can_read_quiz_question_row(question_id))
);

drop policy if exists quiz_choices_insert on public.quiz_choices;
create policy quiz_choices_insert on public.quiz_choices
for insert to authenticated
with check ((select private.can_manage_quiz_question(question_id)));

drop policy if exists quiz_choices_update on public.quiz_choices;
create policy quiz_choices_update on public.quiz_choices
for update to authenticated
using ((select private.can_manage_quiz_question(question_id)))
with check ((select private.can_manage_quiz_question(question_id)));

-- ---------------------------------------------------------------------------
-- quiz_answer_keys
-- ---------------------------------------------------------------------------

drop policy if exists quiz_answer_keys_select on public.quiz_answer_keys;
create policy quiz_answer_keys_select on public.quiz_answer_keys
for select to authenticated
using ((select private.can_read_question_answer_key(question_id)));

drop policy if exists quiz_answer_keys_insert on public.quiz_answer_keys;
create policy quiz_answer_keys_insert on public.quiz_answer_keys
for insert to authenticated
with check ((select private.can_manage_quiz_question(question_id)));

drop policy if exists quiz_answer_keys_update on public.quiz_answer_keys;
create policy quiz_answer_keys_update on public.quiz_answer_keys
for update to authenticated
using ((select private.can_manage_quiz_question(question_id)))
with check ((select private.can_manage_quiz_question(question_id)));

drop policy if exists quiz_answer_keys_delete on public.quiz_answer_keys;
create policy quiz_answer_keys_delete on public.quiz_answer_keys
for delete to authenticated
using ((select private.can_manage_quiz_question(question_id)));

-- ---------------------------------------------------------------------------
-- quiz_match_prompts / quiz_match_options / quiz_match_keys
-- ---------------------------------------------------------------------------

drop policy if exists quiz_match_prompts_select on public.quiz_match_prompts;
create policy quiz_match_prompts_select on public.quiz_match_prompts
for select to authenticated
using (
  deleted_at is null
  and (select private.can_read_quiz_question_row(question_id))
);

drop policy if exists quiz_match_options_select on public.quiz_match_options;
create policy quiz_match_options_select on public.quiz_match_options
for select to authenticated
using (
  deleted_at is null
  and (select private.can_read_quiz_question_row(question_id))
);

drop policy if exists quiz_match_prompts_insert on public.quiz_match_prompts;
create policy quiz_match_prompts_insert on public.quiz_match_prompts
for insert to authenticated
with check ((select private.can_manage_quiz_question(question_id)));

drop policy if exists quiz_match_options_insert on public.quiz_match_options;
create policy quiz_match_options_insert on public.quiz_match_options
for insert to authenticated
with check ((select private.can_manage_quiz_question(question_id)));

drop policy if exists quiz_match_prompts_update on public.quiz_match_prompts;
create policy quiz_match_prompts_update on public.quiz_match_prompts
for update to authenticated
using ((select private.can_manage_quiz_question(question_id)))
with check ((select private.can_manage_quiz_question(question_id)));

drop policy if exists quiz_match_options_update on public.quiz_match_options;
create policy quiz_match_options_update on public.quiz_match_options
for update to authenticated
using ((select private.can_manage_quiz_question(question_id)))
with check ((select private.can_manage_quiz_question(question_id)));

drop policy if exists quiz_match_keys_select on public.quiz_match_keys;
create policy quiz_match_keys_select on public.quiz_match_keys
for select to authenticated
using ((select private.can_read_question_answer_key(question_id)));

drop policy if exists quiz_match_keys_insert on public.quiz_match_keys;
create policy quiz_match_keys_insert on public.quiz_match_keys
for insert to authenticated
with check ((select private.can_manage_quiz_question(question_id)));

drop policy if exists quiz_match_keys_update on public.quiz_match_keys;
create policy quiz_match_keys_update on public.quiz_match_keys
for update to authenticated
using ((select private.can_manage_quiz_question(question_id)))
with check ((select private.can_manage_quiz_question(question_id)));

drop policy if exists quiz_match_keys_delete on public.quiz_match_keys;
create policy quiz_match_keys_delete on public.quiz_match_keys
for delete to authenticated
using ((select private.can_manage_quiz_question(question_id)));
