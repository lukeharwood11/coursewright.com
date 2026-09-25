-- Observer membership: staff-chrome read, zero write.
--
-- Dave Lock A:
--   private.is_org_staff stays writers only (owner | admin | instructor).
--   private.can_browse_as_staff adds observer for SELECT / staff browse.
--   INSERT / UPDATE / DELETE and mutating RPCs stay on is_org_staff
--   (or is_org_admin / can_manage_course).
--
-- Admin-breadth reads that today use is_org_admin or can_manage_course
-- cannot switch to can_browse_as_staff: that helper includes instructor
-- and would let every instructor see every course. Those SELECT paths use
-- private.can_browse_like_admin (owner | admin | observer) or
-- private.can_browse_course (existing manage check, plus observer of the
-- course's org). Instructors stay course-scoped. Noted in the PR.
-- Pending collaborator invites stay is_org_admin so invite tokens are not
-- readable by observers.

-- ---------------------------------------------------------------------------
-- Role constraints. Observer is exclusive, like instructor, and may stack
-- with additive is_parent / is_student. Invites have no student profile.
-- ---------------------------------------------------------------------------

alter table public.memberships drop constraint memberships_role_chk;
alter table public.memberships add constraint memberships_role_chk
  check (role in ('owner', 'admin', 'instructor', 'observer', 'parent', 'student'));

alter table public.admin_invites drop constraint admin_invites_role_check;
alter table public.admin_invites add constraint admin_invites_role_check
  check (role in ('owner', 'admin', 'instructor', 'observer', 'parent', 'student'));

alter table public.admin_invites drop constraint admin_invites_parent_student_chk;
alter table public.admin_invites add constraint admin_invites_parent_student_chk
  check (
    (role in ('parent', 'student') and student_profile_id is not null)
    or (role in ('owner', 'admin', 'instructor', 'observer') and student_profile_id is null)
  );

drop index if exists public.admin_invites_pending_staff_email_uidx;
create unique index admin_invites_pending_staff_email_uidx
  on public.admin_invites (organization_id, email)
  where accepted_at is null
    and role in ('owner', 'admin', 'instructor', 'observer');

comment on column public.memberships.role is
  'Governing role. Exclusive when owner, admin, instructor, or observer. Otherwise parent or student.';

-- ---------------------------------------------------------------------------
-- Browse helpers. is_org_staff is unchanged (writers only).
-- ---------------------------------------------------------------------------

create or replace function private.can_browse_as_staff(p_org_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_org_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'instructor', 'observer')
      and m.status = 'active'
  );
$$;

comment on function private.can_browse_as_staff(bigint) is
  'Active owner, admin, instructor, or observer. SELECT / staff-chrome browse. Not a write grant.';

create or replace function private.can_browse_like_admin(p_org_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_org_admin(p_org_id)
    or (
      private.can_browse_as_staff(p_org_id)
      and not private.is_org_staff(p_org_id)
    );
$$;

comment on function private.can_browse_like_admin(bigint) is
  'Active owner, admin, or observer. Org-wide read where SELECT used is_org_admin. Instructors are not included.';

create or replace function private.can_browse_course(p_course_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_manage_course(p_course_id)
    or exists (
      select 1
      from public.courses c
      where c.id = p_course_id
        and private.can_browse_as_staff(c.organization_id)
        and not private.is_org_staff(c.organization_id)
    );
$$;

comment on function private.can_browse_course(bigint) is
  'can_manage_course, or an active observer of that course''s org (drafts included). Not a write grant.';

revoke all on function private.can_browse_as_staff(bigint) from public, anon;
revoke all on function private.can_browse_like_admin(bigint) from public, anon;
revoke all on function private.can_browse_course(bigint) from public, anon;
grant execute on function private.can_browse_as_staff(bigint) to authenticated, service_role;
grant execute on function private.can_browse_like_admin(bigint) to authenticated, service_role;
grant execute on function private.can_browse_course(bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Read functions. Write functions stay on is_org_staff / can_manage_course.
-- ---------------------------------------------------------------------------

do $$
declare
  def text;
begin
  def := pg_get_functiondef('private.can_view_quiz(bigint)'::regprocedure);
  def := replace(def, 'is_org_staff(', 'can_browse_as_staff(');
  execute def;

  def := pg_get_functiondef('private.can_see_discussion(bigint)'::regprocedure);
  def := replace(def, 'is_org_staff(', 'can_browse_as_staff(');
  execute def;

  def := pg_get_functiondef('private.can_view_event(bigint)'::regprocedure);
  def := replace(def, 'is_org_admin(', 'can_browse_like_admin(');
  def := replace(def, 'is_org_staff(', 'can_browse_as_staff(');
  def := replace(def, 'can_manage_course(', 'can_browse_course(');
  execute def;

  def := pg_get_functiondef('private.can_view_course(bigint)'::regprocedure);
  def := replace(def, 'can_manage_course(', 'can_browse_course(');
  execute def;

  def := pg_get_functiondef('private.can_read_quiz_answer_key(bigint)'::regprocedure);
  def := replace(def, 'can_manage_course(', 'can_browse_course(');
  execute def;

  def := pg_get_functiondef('private.can_read_quiz_attempt(bigint)'::regprocedure);
  def := replace(def, 'can_manage_course(', 'can_browse_course(');
  execute def;

  def := pg_get_functiondef('private.can_view_template(bigint)'::regprocedure);
  def := replace(def, 'is_org_admin(', 'can_browse_like_admin(');
  execute def;

  def := pg_get_functiondef('private.caller_can_read_enrollment(bigint)'::regprocedure);
  def := replace(def, 'is_org_admin(', 'can_browse_like_admin(');
  execute def;

  def := pg_get_functiondef('public.course_gradebook(bigint)'::regprocedure);
  def := replace(def, 'can_manage_course(', 'can_browse_course(');
  execute def;

  def := pg_get_functiondef('public.get_org_person_profile(bigint, uuid)'::regprocedure);
  def := replace(def, 'is_org_staff(', 'can_browse_as_staff(');
  execute def;

  def := pg_get_functiondef('private.memberships_preserve_additive_roles()'::regprocedure);
  def := replace(
    def,
    '''owner'', ''admin'', ''instructor''',
    '''owner'', ''admin'', ''instructor'', ''observer'''
  );
  execute def;

  def := pg_get_functiondef('public.normalize_org_invite()'::regprocedure);
  def := replace(
    def,
    '''owner'', ''admin'', ''instructor''',
    '''owner'', ''admin'', ''instructor'', ''observer'''
  );
  execute def;

  def := pg_get_functiondef('public.claim_invite(text)'::regprocedure);
  def := replace(
    def,
    '''owner'', ''admin'', ''instructor''',
    '''owner'', ''admin'', ''instructor'', ''observer'''
  );
  execute def;

  def := pg_get_functiondef(
    'private.discussion_audience_people(bigint, text, bigint, bigint)'::regprocedure
  );
  def := replace(
    def,
    '''owner'', ''admin'', ''instructor''',
    '''owner'', ''admin'', ''instructor'', ''observer'''
  );
  execute def;
end $$;

-- ---------------------------------------------------------------------------
-- SELECT policies that call the writer helpers. Writes are left alone.
-- ---------------------------------------------------------------------------

do $$
declare
  rec record;
  new_using text;
begin
  for rec in
    select
      n.nspname as schema_name,
      c.relname as table_name,
      pol.polname as policy_name,
      pg_get_expr(pol.polqual, pol.polrelid) as using_expr
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pol.polcmd = 'r'
      and pg_get_expr(pol.polqual, pol.polrelid) is not null
      and (
        pg_get_expr(pol.polqual, pol.polrelid) like '%is_org_staff(%'
        or pg_get_expr(pol.polqual, pol.polrelid) like '%is_org_admin(%'
        or pg_get_expr(pol.polqual, pol.polrelid) like '%can_manage_course(%'
      )
  loop
    new_using := rec.using_expr;
    new_using := replace(new_using, 'is_org_admin(', 'can_browse_like_admin(');
    new_using := replace(new_using, 'is_org_staff(', 'can_browse_as_staff(');
    new_using := replace(new_using, 'can_manage_course(', 'can_browse_course(');
    if new_using is distinct from rec.using_expr then
      execute 'alter policy ' || quote_ident(rec.policy_name)
        || ' on ' || quote_ident(rec.schema_name) || '.' || quote_ident(rec.table_name)
        || ' using (' || new_using || ')';
    end if;
  end loop;
end $$;

-- Collaborator invites: owners/admins insert and read observer rows.
-- Visibility of pending staff invites stays is_org_admin (not observer).
drop policy if exists admin_invites_select on public.admin_invites;
create policy admin_invites_select on public.admin_invites
  for select
  to authenticated
  using (
    (
      accepted_at is null
      and email = (select private.current_profile_email())
    )
    or (
      role in ('owner', 'admin', 'instructor', 'observer')
      and (select private.is_org_admin(organization_id))
    )
    or (
      role = 'parent'
      and (select private.is_org_staff(organization_id))
    )
  );

drop policy if exists admin_invites_insert on public.admin_invites;
create policy admin_invites_insert on public.admin_invites
  for insert
  to authenticated
  with check (
    invited_by = (select auth.uid())
    and (
      (
        role in ('owner', 'admin', 'instructor', 'observer')
        and (select private.is_org_admin(organization_id))
      )
      or (
        role = 'parent'
        and (select private.is_org_staff(organization_id))
      )
    )
  );

drop policy if exists admin_invites_delete on public.admin_invites;
create policy admin_invites_delete on public.admin_invites
  for delete
  to authenticated
  using (
    accepted_at is null
    and (
      (
        role in ('owner', 'admin', 'instructor', 'observer')
        and (select private.is_org_admin(organization_id))
      )
      or (
        role = 'parent'
        and (select private.is_org_staff(organization_id))
      )
    )
  );

-- Student invite rows include tokens. Keep them on writers, same as staff invites.
drop policy if exists admin_invites_student_select on public.admin_invites;
create policy admin_invites_student_select on public.admin_invites
for select to authenticated
using (
  role = 'student'
  and (select private.is_org_staff(organization_id))
);

-- Owners/admins may remove an observer the same way they remove an instructor.
drop policy if exists memberships_delete on public.memberships;
create policy memberships_delete on public.memberships
for delete to authenticated
using (
  (select private.is_org_admin(organization_id))
  and role in ('admin', 'instructor', 'observer')
);

drop policy if exists memberships_insert on public.memberships;
create policy memberships_insert on public.memberships
for insert to authenticated
with check (
  (select private.is_org_admin(organization_id))
  and role in ('admin', 'instructor', 'observer')
);

-- Fail the migration if a content SELECT still calls the writer helper.
do $$
declare
  leftover text;
begin
  select string_agg(n.nspname || '.' || c.relname || '.' || pol.polname, ', ' order by c.relname)
    into leftover
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where pol.polcmd = 'r'
    and pg_get_expr(pol.polqual, pol.polrelid) like '%is_org_staff(%'
    and not (n.nspname = 'public' and c.relname = 'admin_invites');

  if leftover is not null then
    raise exception 'SELECT policies still use is_org_staff: %', leftover;
  end if;
end $$;
