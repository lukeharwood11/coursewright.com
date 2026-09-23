-- Fix quizzes INSERT … RETURNING after create.
-- quizzes_select used can_view_quiz(id), which re-reads public.quizzes by id.
-- The in-flight insert is invisible in that nested lookup, so PostgREST returns
-- "new row violates row-level security policy for table quizzes".
-- Evaluate staff access from the row's organization_id (same pattern as
-- materials_select / events_insert_returning).

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
