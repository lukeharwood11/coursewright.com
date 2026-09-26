-- One org person per organization. student_profiles becomes org_profiles
-- (ids kept). Contact email and the in-org name live on that row. Login
-- email and account name stay on profiles. Changing the contact email does
-- not detach a claimed account.

-- ---------------------------------------------------------------------------
-- Preflight
-- ---------------------------------------------------------------------------

do $$
declare
  dup_students text;
  email_clash text;
  broken_links text;
begin
  select string_agg(distinct organization_id::text || ':' || student_email, ', ')
    into dup_students
  from (
    select organization_id, student_email
    from public.student_profiles
    where student_email is not null
    group by organization_id, student_email
    having count(*) > 1
  ) d;

  if dup_students is not null then
    raise exception
      'Two students in one organization share an email (%). Fix that before org profiles.',
      dup_students
      using errcode = 'P0001';
  end if;

  select string_agg(
    distinct sp.organization_id::text || ':' || sp.student_email,
    ', '
  )
    into email_clash
  from public.student_profiles sp
  join public.memberships m
    on m.organization_id = sp.organization_id
   and m.user_id is not null
  join public.profiles p on p.id = m.user_id
  where sp.student_email = p.email
    and sp.user_id is not null
    and sp.user_id is distinct from p.id;

  if email_clash is not null then
    raise exception
      'A student email belongs to a different account in that organization (%).',
      email_clash
      using errcode = 'P0001';
  end if;

  select string_agg(psl.id::text, ', ')
    into broken_links
  from public.parent_student_links psl
  left join public.student_profiles sp on sp.id = psl.student_profile_id
  left join public.profiles parent on parent.id = psl.parent_user_id
  where sp.id is null or parent.id is null;

  if broken_links is not null then
    raise exception
      'A parent link is missing its student or account (%).',
      broken_links
      using errcode = 'P0001';
  end if;
end;
$$;

create temp table org_profile_migration_names as
select id, name from public.student_profiles;

create temp table org_profile_migration_counts as
select
  (select count(*) from public.student_profiles) as students,
  (select count(*) from public.enrollments) as enrollments,
  (select count(*) from public.class_members) as class_members,
  (select count(*) from public.material_submissions) as submissions,
  (select count(*) from public.quiz_attempts) as quiz_attempts,
  (select count(*) from public.report_card_instances) as report_cards,
  (select count(*) from public.parent_student_links) as parent_links;

create temp table org_profile_migration_inserted (
  id bigint primary key,
  kind text not null
);

-- ---------------------------------------------------------------------------
-- Rename and columns
-- ---------------------------------------------------------------------------

alter table public.student_profiles rename to org_profiles;

alter table public.org_profiles
  add column email text,
  add constraint org_profiles_email_lower_chk
    check (email is null or email = lower(email));

update public.org_profiles
set email = student_email
where student_email is not null;

alter table public.org_profiles
  add column counts_as_student boolean not null default false;

update public.org_profiles
set counts_as_student = true;

comment on table public.org_profiles is
  'One person in an organization. name and email are organizer-managed. user_id is the claimed account.';
comment on column public.org_profiles.email is
  'Organizer-managed contact email. May differ from the login email. Changing it does not detach user_id.';
comment on column public.org_profiles.counts_as_student is
  'Billing and student-scoped links. Stays true if this person is also staff.';
comment on column public.org_profiles.name is
  'Name shown inside this organization. Not profiles.name.';

-- Existing triggers still name student_profiles. Hold them until functions are rewritten.
alter table public.org_profiles disable trigger user;

-- An unclaimed student whose contact email is a staff account becomes that person.
update public.org_profiles op
set user_id = p.id
from public.memberships m
join public.profiles p on p.id = m.user_id
where m.organization_id = op.organization_id
  and m.role in ('owner', 'admin', 'instructor', 'observer')
  and m.user_id is not null
  and op.user_id is null
  and op.email = lower(btrim(p.email))
  and not exists (
    select 1
    from public.org_profiles other
    where other.organization_id = op.organization_id
      and other.user_id = p.id
  );

-- ---------------------------------------------------------------------------
-- Staff rows (reuse a row that already has this account)
-- ---------------------------------------------------------------------------

with inserted as (
  insert into public.org_profiles (
    organization_id, name, email, user_id, counts_as_student
  )
  select
    m.organization_id,
    coalesce(nullif(trim(p.name), ''), split_part(p.email, '@', 1), 'Member'),
    lower(btrim(p.email)),
    m.user_id,
    false
  from public.memberships m
  join public.profiles p on p.id = m.user_id
  where m.user_id is not null
    and m.role in ('owner', 'admin', 'instructor', 'observer')
    and not exists (
      select 1
      from public.org_profiles op
      where op.organization_id = m.organization_id
        and op.user_id = m.user_id
    )
  returning id
)
insert into org_profile_migration_inserted (id, kind)
select id, 'staff' from inserted;

update public.org_profiles op
set email = lower(btrim(p.email))
from public.profiles p
where op.user_id = p.id
  and op.email is null
  and not exists (
    select 1
    from public.org_profiles other
    where other.organization_id = op.organization_id
      and other.id <> op.id
      and other.email = lower(btrim(p.email))
  );

-- A student contact email that is already a parent's login is the same person.
update public.org_profiles op
set user_id = parent.id
from public.parent_student_links psl
join public.org_profiles student on student.id = psl.student_profile_id
join public.profiles parent on parent.id = psl.parent_user_id
where op.id = student.id
  and op.user_id is null
  and op.email = lower(btrim(parent.email))
  and not exists (
    select 1
    from public.org_profiles other
    where other.organization_id = op.organization_id
      and other.user_id = parent.id
  );

-- ---------------------------------------------------------------------------
-- Parents
-- ---------------------------------------------------------------------------

with inserted as (
  insert into public.org_profiles (
    organization_id, name, email, user_id, counts_as_student
  )
  select distinct
    student.organization_id,
    coalesce(nullif(trim(parent.name), ''), split_part(parent.email, '@', 1), 'Member'),
    lower(btrim(parent.email)),
    psl.parent_user_id,
    false
  from public.parent_student_links psl
  join public.org_profiles student on student.id = psl.student_profile_id
  join public.profiles parent on parent.id = psl.parent_user_id
  where not exists (
    select 1
    from public.org_profiles op
    where op.organization_id = student.organization_id
      and op.user_id = psl.parent_user_id
  )
  returning id
)
insert into org_profile_migration_inserted (id, kind)
select id, 'parent' from inserted;

alter table public.parent_student_links
  add column parent_org_profile_id bigint;

alter table public.parent_student_links disable trigger user;

update public.parent_student_links psl
set parent_org_profile_id = op.id
from public.org_profiles student
join public.org_profiles op
  on op.organization_id = student.organization_id
where student.id = psl.student_profile_id
  and op.user_id = psl.parent_user_id
  and psl.parent_org_profile_id is null;

do $$
declare
  missing int;
begin
  select count(*) into missing
  from public.parent_student_links
  where parent_org_profile_id is null;
  if missing > 0 then
    raise exception '% parent link(s) did not resolve to an org profile.', missing
      using errcode = 'P0001';
  end if;
end;
$$;

alter table public.parent_student_links
  alter column parent_org_profile_id set not null;

alter table public.parent_student_links
  add constraint parent_student_links_parent_org_profile_id_fkey
    foreign key (parent_org_profile_id)
    references public.org_profiles (id)
    on delete cascade;

alter table public.parent_student_links
  add constraint parent_student_links_parent_student_org_key
    unique (parent_org_profile_id, student_profile_id);

create index parent_student_links_parent_org_profile_id_idx
  on public.parent_student_links (parent_org_profile_id);

-- ---------------------------------------------------------------------------
-- Invites, course teachers, class leads
-- ---------------------------------------------------------------------------

alter table public.admin_invites
  add column org_profile_id bigint;

-- Student invites point at the student row.
update public.admin_invites
set org_profile_id = student_profile_id
where role = 'student'
  and student_profile_id is not null
  and org_profile_id is null;

-- Anyone already stored under this contact email.
update public.admin_invites i
set org_profile_id = op.id
from public.org_profiles op
where i.org_profile_id is null
  and op.organization_id = i.organization_id
  and op.email = i.email;

-- Claimed account with this login email, when the org row has no contact email yet.
update public.admin_invites i
set org_profile_id = op.id
from public.profiles p
join public.org_profiles op
  on op.user_id = p.id
where i.org_profile_id is null
  and p.email = i.email
  and op.organization_id = i.organization_id;

with inserted as (
  insert into public.org_profiles (
    organization_id, name, email, counts_as_student
  )
  select distinct
    i.organization_id,
    coalesce(nullif(split_part(i.email, '@', 1), ''), 'Member'),
    lower(btrim(i.email)),
    false
  from public.admin_invites i
  where i.org_profile_id is null
    and not exists (
      select 1
      from public.org_profiles op
      where op.organization_id = i.organization_id
        and op.email = i.email
    )
  returning id, organization_id, email
)
insert into org_profile_migration_inserted (id, kind)
select id, 'invite' from inserted;

update public.admin_invites i
set org_profile_id = op.id
from public.org_profiles op
where i.org_profile_id is null
  and op.organization_id = i.organization_id
  and op.email = i.email;

do $$
declare
  missing int;
begin
  select count(*) into missing
  from public.admin_invites
  where org_profile_id is null;
  if missing > 0 then
    raise exception '% invite(s) have no org profile.', missing
      using errcode = 'P0001';
  end if;
end;
$$;

alter table public.admin_invites
  alter column org_profile_id set not null;

alter table public.admin_invites
  add constraint admin_invites_org_profile_id_fkey
    foreign key (org_profile_id)
    references public.org_profiles (id)
    on delete cascade;

create index admin_invites_org_profile_id_idx
  on public.admin_invites (org_profile_id);

alter table public.course_instructors
  add column org_profile_id bigint;

update public.course_instructors ci
set org_profile_id = op.id
from public.courses c
join public.org_profiles op
  on op.organization_id = c.organization_id
where ci.course_id = c.id
  and op.user_id = ci.user_id
  and ci.org_profile_id is null;

do $$
declare
  missing int;
begin
  select count(*) into missing
  from public.course_instructors
  where org_profile_id is null;
  if missing > 0 then
    raise exception '% course teacher row(s) have no org profile.', missing
      using errcode = 'P0001';
  end if;
end;
$$;

alter table public.course_instructors
  alter column org_profile_id set not null;

alter table public.course_instructors
  alter column user_id drop not null;

alter table public.course_instructors
  add constraint course_instructors_org_profile_id_fkey
    foreign key (org_profile_id)
    references public.org_profiles (id)
    on delete cascade;

alter table public.course_instructors
  add constraint course_instructors_course_org_profile_key
    unique (course_id, org_profile_id);

alter table public.class_leaders
  add column org_profile_id bigint;

update public.class_leaders cl
set org_profile_id = op.id
from public.classes k
join public.org_profiles op
  on op.organization_id = k.organization_id
where cl.class_id = k.id
  and op.user_id = cl.user_id
  and cl.org_profile_id is null;

do $$
declare
  missing int;
begin
  select count(*) into missing
  from public.class_leaders
  where org_profile_id is null;
  if missing > 0 then
    raise exception '% class lead row(s) have no org profile.', missing
      using errcode = 'P0001';
  end if;
end;
$$;

alter table public.class_leaders
  alter column org_profile_id set not null;

alter table public.class_leaders
  alter column user_id drop not null;

alter table public.class_leaders
  add constraint class_leaders_org_profile_id_fkey
    foreign key (org_profile_id)
    references public.org_profiles (id)
    on delete cascade;

alter table public.class_leaders
  add constraint class_leaders_class_org_profile_key
    unique (class_id, org_profile_id);

-- ---------------------------------------------------------------------------
-- In-org name lookup, then rewrite function bodies
-- ---------------------------------------------------------------------------

create or replace function private.org_person_name(
  p_org_id bigint,
  p_user_id uuid
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(trim(op.name), '')
  from public.org_profiles op
  where op.organization_id = p_org_id
    and op.user_id = p_user_id
  limit 1
$$;

revoke all on function private.org_person_name(bigint, uuid) from public, anon;
grant execute on function private.org_person_name(bigint, uuid)
  to authenticated, service_role;

create temp table org_profile_fn_rewrite (id serial primary key, def text);

insert into org_profile_fn_rewrite (def)
select pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
  and p.prokind = 'f'
  and (
    pg_get_functiondef(p.oid) like '%student_profiles%'
    or pg_get_functiondef(p.oid) like '%student_email%'
    or pg_get_functiondef(p.oid) like '%parent_user_id%'
  );

do $$
declare
  rec record;
  def text;
begin
  for rec in select id, org_profile_fn_rewrite.def from org_profile_fn_rewrite loop
    def := rec.def;
    def := replace(def, 'public.student_profiles', 'public.org_profiles');
    def := replace(def, 'student_profiles', 'org_profiles');
    def := replace(def, '.student_email', '.email');
    def := replace(
      def,
      'psl.parent_user_id',
      '(select op_parent.user_id from public.org_profiles op_parent where op_parent.id = psl.parent_org_profile_id)'
    );
    def := replace(
      def,
      'l.parent_user_id',
      '(select op_parent.user_id from public.org_profiles op_parent where op_parent.id = l.parent_org_profile_id)'
    );
    def := replace(
      def,
      'new.parent_user_id',
      '(select op_parent.user_id from public.org_profiles op_parent where op_parent.id = new.parent_org_profile_id)'
    );
    def := replace(
      def,
      'old.parent_user_id',
      '(select op_parent.user_id from public.org_profiles op_parent where op_parent.id = old.parent_org_profile_id)'
    );
    def := replace(
      def,
      'insert into public.parent_student_links (parent_user_id, student_profile_id)',
      'insert into public.parent_student_links (parent_org_profile_id, student_profile_id)'
    );
    def := replace(
      def,
      'on conflict (parent_user_id, student_profile_id)',
      'on conflict (parent_org_profile_id, student_profile_id)'
    );
    def := replace(
      def,
      'select caller, ais.student_profile_id',
      'select invite.org_profile_id, ais.student_profile_id'
    );
    def := replace(
      def,
      'values (caller, invite.student_profile_id)',
      'values (invite.org_profile_id, invite.student_profile_id)'
    );
    -- student_profiles meant "this account is a student". After the rename,
    -- every org person matches unless the check requires counts_as_student.
    def := replace(
      def,
      'from public.org_profiles sp' || E'\n'
        || '      where sp.user_id = new.user_id' || E'\n'
        || '        and sp.organization_id = new.organization_id',
      'from public.org_profiles sp' || E'\n'
        || '      where sp.user_id = new.user_id' || E'\n'
        || '        and sp.organization_id = new.organization_id' || E'\n'
        || '        and sp.counts_as_student'
    );
    def := replace(
      def,
      'from public.org_profiles sp' || E'\n'
        || '        where sp.user_id = m.user_id' || E'\n'
        || '          and sp.organization_id = m.organization_id',
      'from public.org_profiles sp' || E'\n'
        || '        where sp.user_id = m.user_id' || E'\n'
        || '          and sp.organization_id = m.organization_id' || E'\n'
        || '          and sp.counts_as_student'
    );
    def := replace(
      def,
      'where sp.id = p_student_id' || E'\n'
        || '      and sp.user_id = (select auth.uid())',
      'where sp.id = p_student_id' || E'\n'
        || '      and sp.user_id = (select auth.uid())' || E'\n'
        || '      and sp.counts_as_student'
    );

    if def ilike '%function public.claim_invite(%' then
      def := replace(
        def,
        'if caller_email is distinct from invite.email then' || E'\n'
          || '    raise exception ''Sign in with the invited email to accept.'' using errcode = ''P0001'';' || E'\n'
          || '  end if;',
        'if caller_email is distinct from invite.email then' || E'\n'
          || '    raise exception ''Sign in with the invited email to accept.'' using errcode = ''P0001'';' || E'\n'
          || '  end if;' || E'\n'
          || '  perform set_config(''coursewright.org_profile_link'', ''1'', true);' || E'\n'
          || '  update public.org_profiles' || E'\n'
          || '  set user_id = caller' || E'\n'
          || '  where id = invite.org_profile_id' || E'\n'
          || '    and organization_id = invite.organization_id' || E'\n'
          || '    and (user_id is null or user_id = caller);' || E'\n'
          || '  update public.course_instructors ci' || E'\n'
          || '  set user_id = caller' || E'\n'
          || '  from public.courses c' || E'\n'
          || '  where ci.org_profile_id = invite.org_profile_id' || E'\n'
          || '    and ci.course_id = c.id' || E'\n'
          || '    and c.organization_id = invite.organization_id' || E'\n'
          || '    and ci.user_id is null;' || E'\n'
          || '  update public.class_leaders cl' || E'\n'
          || '  set user_id = caller' || E'\n'
          || '  from public.classes k' || E'\n'
          || '  where cl.org_profile_id = invite.org_profile_id' || E'\n'
          || '    and cl.class_id = k.id' || E'\n'
          || '    and k.organization_id = invite.organization_id' || E'\n'
          || '    and cl.user_id is null;'
      );
    end if;

    if def ilike '%function public.get_org_person_profile(%' then
      def := replace(
        def,
        'coalesce(nullif(trim(p.name), ''''), p.email, ''Someone'') as name',
        'coalesce(private.org_person_name(p_organization_id, m.user_id), ''Someone'') as name'
      );
    end if;

    if def ilike '%function private.discussion_audience_people(%' then
      def := replace(
        def,
        'coalesce(nullif(trim(p.name), ''''), p.email, ''Someone'') as display_name',
        'coalesce(private.org_person_name(m.organization_id, m.user_id), p.email, ''Someone'') as display_name'
      );
    end if;

    if def ilike '%function private.enqueue_report_card_deliveries(%' then
      def := replace(
        def,
        'v_user := card.student_user_id;',
        'v_user := card.student_user_id;' || E'\n'
          || '  if v_user is not null then' || E'\n'
          || '    select p.email into v_email from public.profiles p where p.id = v_user;' || E'\n'
          || '  end if;'
      );
    end if;

    execute def;
  end loop;
end;
$$;

alter table public.org_profiles enable trigger user;
alter table public.parent_student_links enable trigger user;

-- Claimed contact-email edits keep the login. Pending invites rotate.
create or replace function private.rotate_org_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pending_invited_by uuid;
  pending_role text;
  pending_student bigint;
begin
  if new.email is not distinct from old.email then
    return new;
  end if;

  select i.invited_by, i.role, i.student_profile_id
    into pending_invited_by, pending_role, pending_student
  from public.admin_invites i
  where i.org_profile_id = old.id
    and i.accepted_at is null
  order by i.created_at desc, i.id desc
  limit 1;

  delete from public.admin_invites
  where org_profile_id = old.id
    and accepted_at is null;

  if old.user_id is null
     and pending_invited_by is not null
     and new.email is not null then
    insert into public.admin_invites (
      organization_id,
      email,
      invited_by,
      role,
      student_profile_id,
      org_profile_id
    ) values (
      old.organization_id,
      new.email,
      coalesce((select auth.uid()), pending_invited_by),
      pending_role,
      pending_student,
      old.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists student_profiles_rotate_email_access on public.org_profiles;

alter table public.org_profiles drop column student_email;

create trigger org_profiles_rotate_email
before update of email on public.org_profiles
for each row
execute function private.rotate_org_profile_email();

-- ---------------------------------------------------------------------------
-- Drop parent_user_id now that functions read parent_org_profile_id
-- ---------------------------------------------------------------------------

drop policy if exists parent_student_links_select on public.parent_student_links;

alter table public.parent_student_links
  drop constraint parent_student_links_parent_student_key;

alter table public.parent_student_links
  drop column parent_user_id;

create policy parent_student_links_select on public.parent_student_links
for select to authenticated
using (
  exists (
    select 1
    from public.org_profiles op
    where op.id = parent_org_profile_id
      and op.user_id = (select auth.uid())
  )
  or (select private.is_org_staff((
    select sp.organization_id
    from public.org_profiles sp
    where sp.id = student_profile_id
  )))
);

-- ---------------------------------------------------------------------------
-- Who may edit the org name and contact email
-- ---------------------------------------------------------------------------

create or replace function private.org_profile_is_parent(p_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.parent_student_links psl
    where psl.parent_org_profile_id = p_id
  );
$$;

revoke all on function private.org_profile_is_parent(bigint) from public, anon;
grant execute on function private.org_profile_is_parent(bigint)
  to authenticated, service_role;

create or replace function private.guard_org_profile_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  self boolean;
  staff_editor boolean;
begin
  if current_setting('coursewright.org_profile_link', true) = '1' then
    return new;
  end if;

  if caller is null then
    return new;
  end if;

  if private.is_org_admin(new.organization_id) then
    return new;
  end if;

  self := new.user_id is not null and new.user_id = caller;
  staff_editor := private.is_org_staff(new.organization_id)
    and (
      new.counts_as_student
      or private.org_profile_is_parent(new.id)
    )
    and not self;

  if new.email is distinct from old.email then
    if self or not staff_editor then
      raise exception 'You can’t change that email.'
        using errcode = '42501';
    end if;
  end if;

  if self and not staff_editor then
    if new.grade_level is distinct from old.grade_level
       or new.parent_email is distinct from old.parent_email
       or new.counts_as_student is distinct from old.counts_as_student
       or new.user_id is distinct from old.user_id
       or new.organization_id is distinct from old.organization_id
       or new.created_via_course_id is distinct from old.created_via_course_id
    then
      raise exception 'You can only change your name in this organization.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger org_profiles_guard_identity
before update on public.org_profiles
for each row
execute function private.guard_org_profile_identity();

drop policy if exists student_profiles_update on public.org_profiles;

create policy org_profiles_update on public.org_profiles
for update to authenticated
using (
  (select private.is_org_admin(organization_id))
  or (
    (select private.is_org_staff(organization_id))
    and (
      counts_as_student
      or (select private.org_profile_is_parent(id))
    )
  )
  or (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.memberships m
      where m.organization_id = org_profiles.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
        and m.role in ('owner', 'admin', 'instructor', 'observer')
    )
  )
)
with check (
  (select private.is_org_admin(organization_id))
  or (
    (select private.is_org_staff(organization_id))
    and (
      counts_as_student
      or (select private.org_profile_is_parent(id))
    )
  )
  or (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.memberships m
      where m.organization_id = org_profiles.organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
        and m.role in ('owner', 'admin', 'instructor', 'observer')
    )
  )
);

-- New invites bind an org profile when the client does not send one.
create or replace function private.assign_invite_org_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing bigint;
  local_name text;
begin
  if new.org_profile_id is not null then
    return new;
  end if;

  if new.role = 'student' then
    new.org_profile_id := new.student_profile_id;
    return new;
  end if;

  select op.id into existing
  from public.org_profiles op
  where op.organization_id = new.organization_id
    and op.email = new.email
  limit 1;

  if existing is not null then
    new.org_profile_id := existing;
    return new;
  end if;

  local_name := coalesce(nullif(split_part(new.email, '@', 1), ''), 'Member');
  perform set_config('coursewright.org_profile_link', '1', true);
  insert into public.org_profiles (
    organization_id, name, email, counts_as_student
  ) values (
    new.organization_id, local_name, new.email, false
  )
  returning id into new.org_profile_id;

  return new;
end;
$$;

create trigger admin_invites_set_org_profile
before insert on public.admin_invites
for each row
execute function private.assign_invite_org_profile();

create or replace function private.student_link_requires_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.org_profiles op
    where op.id = new.student_profile_id
      and op.counts_as_student
  ) then
    raise exception 'That person is not a student.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger enrollments_require_student
before insert or update of student_profile_id on public.enrollments
for each row
execute function private.student_link_requires_student();

create trigger class_members_require_student
before insert or update of student_profile_id on public.class_members
for each row
execute function private.student_link_requires_student();

-- App inserts still pass user_id. Fill the org profile before the not-null check.
create or replace function private.sync_course_instructor_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.org_profile_id is null and new.user_id is not null then
    select op.id into new.org_profile_id
    from public.courses c
    join public.org_profiles op
      on op.organization_id = c.organization_id
     and op.user_id = new.user_id
    where c.id = new.course_id;
  end if;

  if new.user_id is null and new.org_profile_id is not null then
    select op.user_id into new.user_id
    from public.org_profiles op
    where op.id = new.org_profile_id;
  end if;

  if new.org_profile_id is null then
    raise exception 'Choose a person in this organization.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger course_instructors_sync_profile
before insert or update on public.course_instructors
for each row
execute function private.sync_course_instructor_profile();

create or replace function private.sync_class_leader_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.org_profile_id is null and new.user_id is not null then
    select op.id into new.org_profile_id
    from public.classes k
    join public.org_profiles op
      on op.organization_id = k.organization_id
     and op.user_id = new.user_id
    where k.id = new.class_id;
  end if;

  if new.user_id is null and new.org_profile_id is not null then
    select op.user_id into new.user_id
    from public.org_profiles op
    where op.id = new.org_profile_id;
  end if;

  if new.org_profile_id is null then
    raise exception 'Choose a person in this organization.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger class_leaders_sync_profile
before insert or update on public.class_leaders
for each row
execute function private.sync_class_leader_profile();

-- ---------------------------------------------------------------------------
-- Email uniqueness after backfill, then assertions
-- ---------------------------------------------------------------------------

do $$
declare
  clash text;
begin
  select string_agg(distinct organization_id::text || ':' || email, ', ')
    into clash
  from (
    select organization_id, email
    from public.org_profiles
    where email is not null
    group by organization_id, email
    having count(*) > 1
  ) d;
  if clash is not null then
    raise exception 'Org contact emails collide (%).', clash
      using errcode = 'P0001';
  end if;
end;
$$;

do $$
declare
  shared_account text;
begin
  select string_agg(distinct organization_id::text || ':' || user_id::text, ', ')
    into shared_account
  from (
    select organization_id, user_id
    from public.org_profiles
    where user_id is not null
    group by organization_id, user_id
    having count(*) > 1
  ) d;
  if shared_account is not null then
    raise exception 'Two people in one organization share an account (%).', shared_account
      using errcode = 'P0001';
  end if;
end;
$$;

create unique index org_profiles_org_email_uidx
  on public.org_profiles (organization_id, email)
  where email is not null;

do $$
declare
  counts record;
  renamed int;
  renamed_students int;
  changed_names int;
  bad_inserted int;
  staff_missing int;
  pending_missing int;
begin
  select * into counts from org_profile_migration_counts;

  select count(*) into renamed from public.org_profiles op
  join org_profile_migration_names n on n.id = op.id;

  select count(*) into renamed_students
  from public.org_profiles
  where counts_as_student;

  if renamed <> counts.students or renamed_students <> counts.students then
    raise exception 'Student org profiles were not preserved.';
  end if;

  if (select count(*) from public.enrollments) <> counts.enrollments
     or (select count(*) from public.class_members) <> counts.class_members
     or (select count(*) from public.material_submissions) <> counts.submissions
     or (select count(*) from public.quiz_attempts) <> counts.quiz_attempts
     or (select count(*) from public.report_card_instances) <> counts.report_cards
     or (select count(*) from public.parent_student_links) <> counts.parent_links
  then
    raise exception 'Org profile migration changed related row counts.';
  end if;

  select count(*) into changed_names
  from public.org_profiles op
  join org_profile_migration_names n on n.id = op.id
  where op.name is distinct from n.name;

  if changed_names <> 0 then
    raise exception 'Migration changed % student name(s).', changed_names;
  end if;

  select count(*) into bad_inserted
  from org_profile_migration_inserted i
  join public.org_profiles op on op.id = i.id
  where op.counts_as_student;

  if bad_inserted <> 0 then
    raise exception 'A staff, parent, or invite profile was marked as a student.';
  end if;

  select count(*) into staff_missing
  from public.memberships m
  where m.user_id is not null
    and m.role in ('owner', 'admin', 'instructor', 'observer')
    and not exists (
      select 1
      from public.org_profiles op
      where op.organization_id = m.organization_id
        and op.user_id = m.user_id
    );

  if staff_missing <> 0 then
    raise exception '% staff membership(s) have no org profile.', staff_missing;
  end if;

  select count(*) into pending_missing
  from public.admin_invites
  where org_profile_id is null;

  if pending_missing <> 0 then
    raise exception 'An invite is missing its org profile.';
  end if;
end;
$$;

-- New memberships after this migration still need one org person.
create or replace function private.ensure_membership_org_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_name text;
  account_email text;
  linked_id bigint;
begin
  if new.user_id is null then
    return new;
  end if;

  if exists (
    select 1
    from public.org_profiles op
    where op.organization_id = new.organization_id
      and op.user_id = new.user_id
  ) then
    return new;
  end if;

  select
    nullif(btrim(p.name), ''),
    nullif(lower(btrim(p.email)), '')
  into account_name, account_email
  from public.profiles p
  where p.id = new.user_id;

  if account_email is not null then
    update public.org_profiles op
    set user_id = new.user_id
    where op.organization_id = new.organization_id
      and op.user_id is null
      and op.email = account_email
    returning op.id into linked_id;

    if linked_id is not null then
      return new;
    end if;
  end if;

  insert into public.org_profiles (
    organization_id, name, email, user_id, counts_as_student
  )
  values (
    new.organization_id,
    coalesce(account_name, split_part(coalesce(account_email, 'member'), '@', 1), 'Member'),
    account_email,
    new.user_id,
    new.role = 'student'
  );

  return new;
exception
  when unique_violation then
    return new;
end;
$$;

create trigger memberships_ensure_org_profile
after insert on public.memberships
for each row
execute function private.ensure_membership_org_profile();

-- Unsigned visitors reach claim_invite and get "not authenticated".
-- The function still refuses a null caller before it links anyone.
grant execute on function public.claim_invite(text) to anon;
