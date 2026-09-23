-- Staff who manage the course can mark Correct / Incorrect on an attempt answer
-- (short answer, long answer, or anything left unscored after autograde).

create or replace function public.grade_quiz_attempt_answer(
  p_attempt_id bigint,
  p_question_id bigint,
  p_is_correct boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id bigint;
  v_updated int;
begin
  select q.course_id
  into v_course_id
  from public.quiz_attempts a
  join public.quizzes q on q.id = a.quiz_id
  where a.id = p_attempt_id;

  if v_course_id is null then
    raise exception 'That quiz entry was not found.';
  end if;

  if not private.can_manage_course(v_course_id) then
    raise exception 'You cannot grade this quiz entry.';
  end if;

  update public.quiz_attempt_answers
  set is_correct = p_is_correct
  where attempt_id = p_attempt_id
    and question_id = p_question_id;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'That answer was not found.';
  end if;
end;
$$;

revoke all on function public.grade_quiz_attempt_answer(bigint, bigint, boolean)
  from public, anon;
grant execute on function public.grade_quiz_attempt_answer(bigint, bigint, boolean)
  to authenticated, service_role;
