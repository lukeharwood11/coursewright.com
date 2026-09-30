-- Attendance capture: whole-day mark, class sheet, and course sheet.
-- Package submit for report cards is not in this migration.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.attendance_days (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  student_profile_id bigint not null references public.org_profiles (id) on delete cascade,
  on_date date not null,
  status text not null,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_days_status_chk check (
    status in ('present', 'absent', 'excused', 'partial')
  ),
  constraint attendance_days_student_date_key unique (student_profile_id, on_date)
);

create index attendance_days_org_date_idx
  on public.attendance_days (organization_id, on_date);

comment on table public.attendance_days is
  'Whole-day attendance for one student on one date. Does not replace class or course sheet rows.';

create table public.attendance_class_entries (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  class_id bigint not null references public.classes (id) on delete cascade,
  student_profile_id bigint not null references public.org_profiles (id) on delete cascade,
  on_date date not null,
  status text not null,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_class_entries_status_chk check (
    status in ('present', 'absent', 'late', 'excused')
  ),
  constraint attendance_class_entries_sheet_key unique (class_id, student_profile_id, on_date)
);

create index attendance_class_entries_class_date_idx
  on public.attendance_class_entries (class_id, on_date);
create index attendance_class_entries_student_date_idx
  on public.attendance_class_entries (student_profile_id, on_date);

comment on table public.attendance_class_entries is
  'Class attendance sheet. A new row requires current class membership. An existing row stays after the student leaves.';

create table public.attendance_course_entries (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  course_id bigint not null references public.courses (id) on delete cascade,
  student_profile_id bigint not null references public.org_profiles (id) on delete cascade,
  on_date date not null,
  status text not null,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_course_entries_status_chk check (
    status in ('present', 'absent', 'late', 'excused')
  ),
  constraint attendance_course_entries_sheet_key unique (course_id, student_profile_id, on_date)
);

create index attendance_course_entries_course_date_idx
  on public.attendance_course_entries (course_id, on_date);
create index attendance_course_entries_student_date_idx
  on public.attendance_course_entries (student_profile_id, on_date);

comment on table public.attendance_course_entries is
  'Course attendance sheet. A new row requires an active enrollment. An existing row stays after the enrollment ends.';

-- ---------------------------------------------------------------------------
-- Stamp recorder and freeze identity columns
-- ---------------------------------------------------------------------------

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
    -- PL/pgSQL evaluates both sides of AND, so class_id and course_id
    -- are read only inside the branch for the table that has that column.
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

create trigger attendance_days_stamp
before insert or update on public.attendance_days
for each row execute function private.stamp_attendance_row();

create trigger attendance_class_entries_stamp
before insert or update on public.attendance_class_entries
for each row execute function private.stamp_attendance_row();

create trigger attendance_course_entries_stamp
before insert or update on public.attendance_course_entries
for each row execute function private.stamp_attendance_row();

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------

create or replace function private.is_class_lead(p_class_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_leaders cl
    join public.classes c on c.id = cl.class_id
    join public.memberships m
      on m.organization_id = c.organization_id
     and m.user_id = cl.user_id
     and m.status = 'active'
     and m.role in ('owner', 'admin', 'instructor')
    where cl.class_id = p_class_id
      and cl.user_id = (select auth.uid())
      and c.deleted_at is null
  );
$$;

comment on function private.is_class_lead(bigint) is
  'Claimed class lead with an active owner, admin, or instructor membership.';

create or replace function private.can_read_student_attendance(
  p_organization_id bigint,
  p_student_profile_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.can_browse_as_staff(p_organization_id))
    or (select private.parent_linked_to_student(p_student_profile_id))
    or (select private.student_owns_profile(p_student_profile_id));
$$;

create or replace function private.attendance_student_in_org(
  p_organization_id bigint,
  p_student_profile_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.org_profiles sp
    where sp.id = p_student_profile_id
      and sp.organization_id = p_organization_id
      and sp.counts_as_student
  );
$$;

create or replace function private.can_write_attendance_day(p_student_profile_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.org_profiles sp
    where sp.id = p_student_profile_id
      and sp.counts_as_student
      and (
        (select private.is_org_admin(sp.organization_id))
        or exists (
          select 1
          from public.class_members cm
          where cm.student_profile_id = sp.id
            and (select private.is_class_lead(cm.class_id))
        )
        or exists (
          select 1
          from public.enrollments e
          where e.student_profile_id = sp.id
            and e.status = 'active'
            and (select private.is_course_instructor(e.course_id))
        )
      )
  );
$$;

comment on function private.can_write_attendance_day(bigint) is
  'Owners and admins; a class lead for a current member; a course instructor for an active enrollment.';

create or replace function private.can_insert_class_attendance(
  p_organization_id bigint,
  p_class_id bigint,
  p_student_profile_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.classes c
    where c.id = p_class_id
      and c.organization_id = p_organization_id
      and c.deleted_at is null
      and (select private.attendance_student_in_org(p_organization_id, p_student_profile_id))
      and (
        (select private.is_org_admin(p_organization_id))
        or (select private.is_class_lead(p_class_id))
      )
      and exists (
        select 1
        from public.class_members cm
        where cm.class_id = p_class_id
          and cm.student_profile_id = p_student_profile_id
      )
  );
$$;

create or replace function private.can_update_class_attendance(
  p_organization_id bigint,
  p_class_id bigint,
  p_student_profile_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.classes c
    where c.id = p_class_id
      and c.organization_id = p_organization_id
      and c.deleted_at is null
      and (select private.attendance_student_in_org(p_organization_id, p_student_profile_id))
      and (
        (select private.is_org_admin(p_organization_id))
        or (select private.is_class_lead(p_class_id))
      )
  );
$$;

create or replace function private.can_insert_course_attendance(
  p_organization_id bigint,
  p_course_id bigint,
  p_student_profile_id bigint
)
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
      and c.organization_id = p_organization_id
      and (select private.can_manage_course(p_course_id))
      and (select private.attendance_student_in_org(p_organization_id, p_student_profile_id))
      and exists (
        select 1
        from public.enrollments e
        where e.course_id = p_course_id
          and e.student_profile_id = p_student_profile_id
          and e.status = 'active'
      )
  );
$$;

create or replace function private.can_update_course_attendance(
  p_organization_id bigint,
  p_course_id bigint,
  p_student_profile_id bigint
)
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
      and c.organization_id = p_organization_id
      and (select private.can_manage_course(p_course_id))
      and (select private.attendance_student_in_org(p_organization_id, p_student_profile_id))
  );
$$;

revoke all on function private.is_class_lead(bigint) from public, anon;
revoke all on function private.can_read_student_attendance(bigint, bigint) from public, anon;
revoke all on function private.attendance_student_in_org(bigint, bigint) from public, anon;
revoke all on function private.can_write_attendance_day(bigint) from public, anon;
revoke all on function private.can_insert_class_attendance(bigint, bigint, bigint) from public, anon;
revoke all on function private.can_update_class_attendance(bigint, bigint, bigint) from public, anon;
revoke all on function private.can_insert_course_attendance(bigint, bigint, bigint) from public, anon;
revoke all on function private.can_update_course_attendance(bigint, bigint, bigint) from public, anon;

grant execute on function private.is_class_lead(bigint) to authenticated, service_role;
grant execute on function private.can_read_student_attendance(bigint, bigint) to authenticated, service_role;
grant execute on function private.attendance_student_in_org(bigint, bigint) to authenticated, service_role;
grant execute on function private.can_write_attendance_day(bigint) to authenticated, service_role;
grant execute on function private.can_insert_class_attendance(bigint, bigint, bigint) to authenticated, service_role;
grant execute on function private.can_update_class_attendance(bigint, bigint, bigint) to authenticated, service_role;
grant execute on function private.can_insert_course_attendance(bigint, bigint, bigint) to authenticated, service_role;
grant execute on function private.can_update_course_attendance(bigint, bigint, bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.attendance_days enable row level security;
alter table public.attendance_class_entries enable row level security;
alter table public.attendance_course_entries enable row level security;

revoke all on table public.attendance_days from anon, authenticated;
revoke all on table public.attendance_class_entries from anon, authenticated;
revoke all on table public.attendance_course_entries from anon, authenticated;

grant select, insert, update, delete on table public.attendance_days to authenticated;
grant select, insert, update, delete on table public.attendance_class_entries to authenticated;
grant select, insert, update, delete on table public.attendance_course_entries to authenticated;
grant select, insert, update, delete on table public.attendance_days to service_role;
grant select, insert, update, delete on table public.attendance_class_entries to service_role;
grant select, insert, update, delete on table public.attendance_course_entries to service_role;
grant usage, select on sequence public.attendance_days_id_seq to authenticated, service_role;
grant usage, select on sequence public.attendance_class_entries_id_seq to authenticated, service_role;
grant usage, select on sequence public.attendance_course_entries_id_seq to authenticated, service_role;

create policy attendance_days_select
on public.attendance_days
for select
to authenticated
using (
  (select private.can_read_student_attendance(organization_id, student_profile_id))
);

create policy attendance_days_insert
on public.attendance_days
for insert
to authenticated
with check (
  (select private.attendance_student_in_org(organization_id, student_profile_id))
  and (select private.can_write_attendance_day(student_profile_id))
);

create policy attendance_days_update
on public.attendance_days
for update
to authenticated
using (
  (select private.attendance_student_in_org(organization_id, student_profile_id))
  and (select private.can_write_attendance_day(student_profile_id))
)
with check (
  (select private.attendance_student_in_org(organization_id, student_profile_id))
  and (select private.can_write_attendance_day(student_profile_id))
);

create policy attendance_days_delete
on public.attendance_days
for delete
to authenticated
using (
  (select private.attendance_student_in_org(organization_id, student_profile_id))
  and (select private.can_write_attendance_day(student_profile_id))
);

create policy attendance_class_entries_select
on public.attendance_class_entries
for select
to authenticated
using (
  (select private.can_read_student_attendance(organization_id, student_profile_id))
);

create policy attendance_class_entries_insert
on public.attendance_class_entries
for insert
to authenticated
with check (
  (select private.can_insert_class_attendance(organization_id, class_id, student_profile_id))
);

create policy attendance_class_entries_update
on public.attendance_class_entries
for update
to authenticated
using (
  (select private.can_update_class_attendance(organization_id, class_id, student_profile_id))
)
with check (
  (select private.can_update_class_attendance(organization_id, class_id, student_profile_id))
);

create policy attendance_class_entries_delete
on public.attendance_class_entries
for delete
to authenticated
using (
  (select private.can_update_class_attendance(organization_id, class_id, student_profile_id))
);

create policy attendance_course_entries_select
on public.attendance_course_entries
for select
to authenticated
using (
  (select private.can_read_student_attendance(organization_id, student_profile_id))
);

create policy attendance_course_entries_insert
on public.attendance_course_entries
for insert
to authenticated
with check (
  (select private.can_insert_course_attendance(organization_id, course_id, student_profile_id))
);

create policy attendance_course_entries_update
on public.attendance_course_entries
for update
to authenticated
using (
  (select private.can_update_course_attendance(organization_id, course_id, student_profile_id))
)
with check (
  (select private.can_update_course_attendance(organization_id, course_id, student_profile_id))
);

create policy attendance_course_entries_delete
on public.attendance_course_entries
for delete
to authenticated
using (
  (select private.can_update_course_attendance(organization_id, course_id, student_profile_id))
);
