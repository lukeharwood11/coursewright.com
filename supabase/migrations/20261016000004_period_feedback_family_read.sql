-- US-84 follow-up: families can read a period-feedback comment after submit,
-- but report_card_fill_cycles stays staff-only. Embedding that table returns a
-- null label and the client drops the row. This function attaches the label
-- without granting fill-cycle SELECT.
-- Placeholder: HN-021

create or replace function public.family_period_feedback(p_student_profile_id bigint)
returns table (
  body text,
  course_id bigint,
  course_title text,
  fill_cycle_id bigint,
  cycle_label text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    feedback.body,
    feedback.course_id,
    course.title,
    feedback.fill_cycle_id,
    cycle.label
  from public.course_period_feedback feedback
  join public.courses course on course.id = feedback.course_id
  join public.report_card_fill_cycles cycle on cycle.id = feedback.fill_cycle_id
  where feedback.student_profile_id = p_student_profile_id
    and (
      private.can_browse_course(feedback.course_id)
      or (
        private.period_feedback_submitted(feedback.course_id, feedback.fill_cycle_id)
        and (
          private.parent_linked_to_student(feedback.student_profile_id)
          or private.student_owns_profile(feedback.student_profile_id)
        )
      )
    );
$$;

comment on function public.family_period_feedback(bigint) is
  'Comments a parent, student, or browsing staff member may read, with the cycle label. Does not expose fill-cycle rows.';

revoke all on function public.family_period_feedback(bigint) from public, anon;
grant execute on function public.family_period_feedback(bigint) to authenticated, service_role;
