-- Fix events INSERT … RETURNING after create.
-- events_select used can_view_event(id), which re-reads public.events by id.
-- The in-flight insert is invisible in that nested lookup, so PostgREST returns
-- "new row violates row-level security policy for table events".
-- Evaluate staff/admin access from the row columns (can_manage_event) instead.

drop policy if exists events_select on public.events;
create policy events_select on public.events
for select to authenticated
using (
  deleted_at is null
  and (
    (select private.can_manage_event(
      organization_id,
      audience,
      course_ids,
      class_ids
    ))
    or (select private.parent_can_view_event(id))
  )
);
