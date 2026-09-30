-- stamp_attendance_row used to read new.class_id on every update.
-- PL/pgSQL evaluates both sides of AND, so course and day updates failed
-- with: record "new" has no field "class_id".

create or replace function private.stamp_attendance_row()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.organization_id is distinct from old.organization_id
       or new.student_profile_id is distinct from old.student_profile_id
       or new.on_date is distinct from old.on_date
       or new.created_at is distinct from old.created_at
    then
      raise exception 'Attendance identity columns cannot change.'
        using errcode = '23514';
    end if;
    if tg_table_name = 'attendance_class_entries' then
      if new.class_id is distinct from old.class_id then
        raise exception 'Attendance identity columns cannot change.'
          using errcode = '23514';
      end if;
    elsif tg_table_name = 'attendance_course_entries' then
      if new.course_id is distinct from old.course_id then
        raise exception 'Attendance identity columns cannot change.'
          using errcode = '23514';
      end if;
    end if;
  end if;

  new.recorded_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;
