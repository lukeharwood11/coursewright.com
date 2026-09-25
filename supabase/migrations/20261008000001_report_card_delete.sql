-- Draft report cards can be removed by staff who manage the course.

create or replace function public.delete_report_card(p_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course bigint;
  v_status text;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to delete a report card.' using errcode = '42501';
  end if;

  select course_id, status
  into v_course, v_status
  from public.report_card_instances
  where id = p_id;

  if v_course is null then
    raise exception 'That report card was not found.' using errcode = 'P0002';
  end if;

  if not private.can_manage_course(v_course) then
    raise exception 'You can’t delete this report card.' using errcode = '42501';
  end if;

  if v_status <> 'draft' then
    raise exception 'Only draft report cards can be deleted.'
      using errcode = '22023';
  end if;

  delete from public.report_card_instances where id = p_id;
end;
$$;

revoke all on function public.delete_report_card(bigint) from public, anon;
grant execute on function public.delete_report_card(bigint) to authenticated, service_role;

-- One enrollment at a time; bulk draft RPCs are no longer exposed to the app.
revoke execute on function public.generate_student_report_cards(bigint) from authenticated;
revoke execute on function public.generate_course_report_cards(bigint) from authenticated;
