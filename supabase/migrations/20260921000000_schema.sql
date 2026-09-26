-- Course Wright schema translated from docs/database/SCHEMA.md.
-- App entity PKs are bigserial; profiles.id stays uuid (= auth.users.id).
-- Final table shapes (no later ALTER chain). RLS lives in the next migration.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

create schema if not exists extensions;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------------

create schema if not exists private;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function private.k12_grade_labels()
returns text[]
language sql
immutable
as $$
  select array[
    'K','1','2','3','4','5','6','7','8','9','10','11','12',
    'K-2','3-5','6-8','9-12'
  ];
$$;

-- ---------------------------------------------------------------------------
-- User → public.profiles (PK = auth.users.id)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  google_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(name, ''))
  ) stored,
  constraint profiles_email_lower_chk check (email = lower(email)),
  constraint profiles_email_key unique (email),
  constraint profiles_google_id_key unique (google_id)
);

create index profiles_email_idx on public.profiles (email);
create index profiles_search_idx on public.profiles using gin (search_vector);

comment on table public.profiles is 'SCHEMA.md User — PostgREST profile; identity is auth.users';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, google_id)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(
      nullif(
        trim(
          concat_ws(
            ' ',
            new.raw_user_meta_data ->> 'first_name',
            new.raw_user_meta_data ->> 'last_name'
          )
        ),
        ''
      ),
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    case
      when new.raw_app_meta_data ->> 'provider' = 'google'
        then new.raw_user_meta_data ->> 'sub'
      else null
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.handle_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = lower(coalesce(new.email, ''))
    where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function private.handle_user_email_updated();

create or replace function private.protect_profile_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profiles.id cannot change';
  end if;
  if new.email is distinct from old.email
     and current_user not in ('postgres', 'supabase_auth_admin', 'service_role') then
    raise exception 'profiles.email is managed by auth';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_identity
before update on public.profiles
for each row execute function private.protect_profile_identity();

-- ---------------------------------------------------------------------------
-- Organization
-- ---------------------------------------------------------------------------

create table public.organizations (
  id bigserial primary key,
  name text not null,
  slug text not null,
  org_type text not null,
  grade_scheme text not null,
  grade_labels text[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(name, ''))
  ) stored,
  constraint organizations_org_type_chk check (org_type in ('other', 'coop', 'micro_school', 'family')),
  constraint organizations_grade_scheme_chk check (grade_scheme in ('k12', 'custom')),
  constraint organizations_slug_format_chk check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint organizations_slug_len_chk check (char_length(slug) between 2 and 60),
  constraint organizations_grade_labels_chk check (cardinality(grade_labels) >= 1),
  constraint organizations_slug_key unique (slug)
);

create index organizations_search_idx on public.organizations using gin (search_vector);

comment on table public.organizations is 'SCHEMA.md Organization';

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function private.set_updated_at();

create or replace function private.unique_org_slug(base text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate text;
  n int := 0;
begin
  candidate := left(nullif(private.slugify(base), ''), 60);
  if candidate is null or char_length(candidate) < 2 then
    candidate := 'org';
  end if;
  while exists (select 1 from public.organizations o where o.slug = candidate) loop
    n := n + 1;
    candidate := left(private.slugify(base), greatest(1, 60 - char_length(n::text) - 1))
      || '-' || n::text;
  end loop;
  return candidate;
end;
$$;

create or replace function private.organizations_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := private.unique_org_slug(new.name);
  else
    new.slug := private.slugify(new.slug);
  end if;
  if new.grade_scheme = 'k12' and (new.grade_labels is null or cardinality(new.grade_labels) = 0) then
    new.grade_labels := private.k12_grade_labels();
  end if;
  return new;
end;
$$;

create trigger organizations_before_insert
before insert on public.organizations
for each row execute function private.organizations_before_insert();

-- ---------------------------------------------------------------------------
-- Membership
-- ---------------------------------------------------------------------------

create table public.memberships (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  role text not null,
  status text not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_role_chk check (role in ('owner', 'admin', 'instructor', 'parent')),
  constraint memberships_status_chk check (status in ('active', 'invited', 'suspended'))
);

create index memberships_organization_id_idx on public.memberships (organization_id);
create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_org_role_status_idx on public.memberships (organization_id, role, status);
create unique index memberships_org_user_uidx
  on public.memberships (organization_id, user_id)
  where user_id is not null;

comment on table public.memberships is 'SCHEMA.md Membership';

create trigger memberships_set_updated_at
before update on public.memberships
for each row execute function private.set_updated_at();

create or replace function private.guard_last_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  org bigint;
  remaining int;
  was_manager boolean;
  still_manager boolean;
begin
  org := coalesce(old.organization_id, new.organization_id);
  was_manager := old.role in ('owner', 'admin') and old.status = 'active';

  if tg_op = 'DELETE' then
    if was_manager then
      select count(*) into remaining
      from public.memberships m
      where m.organization_id = org
        and m.role in ('owner', 'admin')
        and m.status = 'active'
        and m.id is distinct from old.id;
      if remaining < 1 then
        raise exception 'cannot remove or demote the last remaining owner or admin';
      end if;
    end if;
    return old;
  end if;

  still_manager := new.role in ('owner', 'admin') and new.status = 'active';
  if was_manager and not still_manager then
    select count(*) into remaining
    from public.memberships m
    where m.organization_id = org
      and m.role in ('owner', 'admin')
      and m.status = 'active'
      and m.id is distinct from old.id;
    if remaining < 1 then
      raise exception 'cannot remove or demote the last remaining owner or admin';
    end if;
  end if;
  return new;
end;
$$;

create trigger memberships_guard_last_admin
before update or delete on public.memberships
for each row execute function private.guard_last_admin();

-- Demote to parent only when the person still parents a student in this org.
-- Promote parent → staff is a plain role update (no new invite).
create or replace function private.guard_membership_parent_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.role = 'parent'
     and old.role is distinct from 'parent' then
    if new.user_id is null
       or not exists (
         select 1
         from public.parent_student_links psl
         join public.student_profiles sp
           on sp.id = psl.student_profile_id
         where psl.parent_user_id = new.user_id
           and sp.organization_id = new.organization_id
       ) then
      raise exception
        'That person can only become a parent if they are linked to a student in this organization.'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger memberships_guard_parent_role
before update on public.memberships
for each row execute function private.guard_membership_parent_role();

create or replace function private.on_organization_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  insert into public.memberships (organization_id, user_id, role, status)
  values (new.id, (select auth.uid()), 'owner', 'active');
  return new;
end;
$$;

create trigger organizations_after_insert_membership
after insert on public.organizations
for each row execute function private.on_organization_created();

-- ---------------------------------------------------------------------------
-- AdminInvite
-- ---------------------------------------------------------------------------

create table public.admin_invites (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  email text not null,
  invited_by uuid not null references public.profiles (id),
  token text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  membership_id bigint references public.memberships (id) on delete set null,
  role text not null default 'admin',
  student_profile_id bigint,
  created_at timestamptz not null default now(),
  constraint admin_invites_email_lower_chk check (email = lower(email)),
  constraint admin_invites_token_key unique (token),
  constraint admin_invites_role_check
    check (role in ('owner', 'admin', 'instructor', 'parent')),
  constraint admin_invites_parent_student_chk check (
    (role = 'parent' and student_profile_id is not null)
    or (role in ('owner', 'admin', 'instructor') and student_profile_id is null)
  )
);

create index admin_invites_organization_id_idx on public.admin_invites (organization_id);
create index admin_invites_email_idx on public.admin_invites (email);
create unique index admin_invites_pending_staff_email_uidx
  on public.admin_invites (organization_id, email)
  where accepted_at is null and role in ('owner', 'admin', 'instructor');
create unique index admin_invites_pending_parent_uidx
  on public.admin_invites (organization_id, email)
  where accepted_at is null and role = 'parent';
create index admin_invites_pending_email
  on public.admin_invites (email)
  where accepted_at is null;
create index admin_invites_student_profile_id_idx
  on public.admin_invites (student_profile_id);

comment on table public.admin_invites is
  'SCHEMA.md AdminInvite — email-claim tokens for owner/admin/instructor/parent. Membership is created on claim. Parent invites are one pending row per (org, email); students attach via admin_invite_students.';

-- ---------------------------------------------------------------------------
-- CourseTemplate, TemplateAccess
-- ---------------------------------------------------------------------------

create table public.course_templates (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  title text not null,
  description text not null default '',
  grade_levels text[] not null default '{}',
  created_by uuid not null references public.profiles (id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored
);

create index course_templates_organization_id_idx on public.course_templates (organization_id);
create index course_templates_created_by_idx on public.course_templates (created_by);
create index course_templates_search_idx on public.course_templates using gin (search_vector);

comment on table public.course_templates is 'SCHEMA.md CourseTemplate';

create trigger course_templates_set_updated_at
before update on public.course_templates
for each row execute function private.set_updated_at();

create table public.template_access (
  id bigserial primary key,
  template_id bigint not null references public.course_templates (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  permission text not null,
  created_at timestamptz not null default now(),
  constraint template_access_permission_chk check (permission in ('owner', 'edit', 'view')),
  constraint template_access_template_user_key unique (template_id, user_id)
);

create index template_access_template_id_idx on public.template_access (template_id);
create index template_access_user_id_idx on public.template_access (user_id);

comment on table public.template_access is 'SCHEMA.md TemplateAccess';

create or replace function private.on_course_template_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.template_access (template_id, user_id, permission)
  values (new.id, new.created_by, 'owner')
  on conflict (template_id, user_id) do nothing;
  return new;
end;
$$;

create trigger course_templates_after_insert_owner
after insert on public.course_templates
for each row execute function private.on_course_template_created();

-- ---------------------------------------------------------------------------
-- Course, CourseInstructor
-- ---------------------------------------------------------------------------

create table public.courses (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  title text not null,
  description text not null default '',
  template_id bigint references public.course_templates (id) on delete set null,
  copied_from_course_id bigint references public.courses (id) on delete set null,
  start_date date,
  end_date date,
  grade_levels text[] not null default '{}',
  status text not null default 'active',
  location text not null default '',
  subject text not null default '',
  visibility text not null default 'unpublished',
  icon_key text,
  color_key text not null default 'moss',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(subject, '') || ' ' ||
      coalesce(location, '')
    )
  ) stored,
  constraint courses_status_chk check (status in ('active', 'archived')),
  constraint courses_dates_chk check (end_date is null or start_date is null or end_date >= start_date),
  constraint courses_visibility_chk check (visibility in ('published', 'unpublished')),
  constraint courses_color_key_chk check (color_key in (
    'moss', 'slate', 'clay', 'plum', 'sea', 'wine', 'sand', 'pine'
  )),
  constraint courses_icon_key_chk check (
    icon_key is null
    or icon_key in (
      'academic-cap',
      'book-open',
      'beaker',
      'building-library',
      'calculator',
      'computer-desktop',
      'globe-americas',
      'heart',
      'map',
      'light-bulb',
      'musical-note',
      'paint-brush',
      'pencil-square',
      'sparkles',
      'sun',
      'user-group'
    )
  )
);

create index courses_organization_id_idx on public.courses (organization_id);
create index courses_template_id_idx on public.courses (template_id);
create index courses_copied_from_course_id_idx on public.courses (copied_from_course_id);
create index courses_status_idx on public.courses (organization_id, status);
create index courses_org_published_idx
  on public.courses (organization_id)
  where visibility = 'published' and status = 'active';
create index courses_search_idx on public.courses using gin (search_vector);

comment on table public.courses is 'SCHEMA.md Course';
comment on column public.courses.location is 'Optional where the offering meets';
comment on column public.courses.subject is 'Optional subject / area, free text';
comment on column public.courses.visibility is
  'published = enrolled parents (and students later); unpublished = instructors/admins only';
comment on column public.courses.icon_key is
  'Optional Heroicons outline key for course list cards; null = no icon';
comment on column public.courses.color_key is
  'SCHEMA.md Course.color_key — calendar / legend color';

create trigger courses_set_updated_at
before update on public.courses
for each row execute function private.set_updated_at();

create table public.course_instructors (
  id bigserial primary key,
  course_id bigint not null references public.courses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint course_instructors_course_user_key unique (course_id, user_id)
);

create index course_instructors_course_id_idx on public.course_instructors (course_id);
create index course_instructors_user_id_idx on public.course_instructors (user_id);

comment on table public.course_instructors is 'SCHEMA.md CourseInstructor';

create or replace function private.on_course_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Instructors who create a course teach it. Owners/admins assign teachers
  -- manually (they already see every course via is_org_admin).
  if exists (
    select 1
    from public.memberships m
    where m.organization_id = new.organization_id
      and m.user_id = (select auth.uid())
      and m.role = 'instructor'
      and m.status = 'active'
  ) then
    insert into public.course_instructors (course_id, user_id)
    values (new.id, (select auth.uid()))
    on conflict (course_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger courses_after_insert_instructor
after insert on public.courses
for each row execute function private.on_course_created();

-- ---------------------------------------------------------------------------
-- StudentProfile, Family, FamilyMember, ParentStudentLink, Enrollment
-- ---------------------------------------------------------------------------

create table public.student_profiles (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  name text not null,
  parent_email text,
  grade_level text,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_via_course_id bigint references public.courses (id) on delete set null,
  student_email text,
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(name, ''))
  ) stored,
  constraint student_profiles_name_chk check (char_length(btrim(name)) > 0),
  constraint student_profiles_parent_email_lower_chk check (
    parent_email is null or parent_email = lower(parent_email)
  ),
  constraint student_profiles_student_email_lower_chk check (
    student_email is null or student_email = lower(student_email)
  )
);

create index student_profiles_organization_id_idx on public.student_profiles (organization_id);
create index student_profiles_user_id_idx on public.student_profiles (user_id);
create index student_profiles_created_via_course_id_idx on public.student_profiles (created_via_course_id);
create index student_profiles_search_idx on public.student_profiles using gin (search_vector);

comment on table public.student_profiles is 'SCHEMA.md StudentProfile';
comment on column public.student_profiles.student_email is
  'Optional student contact email. Invite uses parent claim path; student role is P2.';
comment on column public.student_profiles.parent_email is
  'Optional first parent email for search/create. Additional parents live on parent_student_links and admin_invites.';

alter table public.admin_invites
  add constraint admin_invites_student_profile_id_fkey
  foreign key (student_profile_id) references public.student_profiles (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- AdminInviteStudents — students attached to a pending parent invite
-- ---------------------------------------------------------------------------

create table public.admin_invite_students (
  id bigserial primary key,
  invite_id bigint not null references public.admin_invites (id) on delete cascade,
  student_profile_id bigint not null references public.student_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint admin_invite_students_invite_student_key unique (invite_id, student_profile_id)
);

create index admin_invite_students_student_profile_id_idx
  on public.admin_invite_students (student_profile_id);
create index admin_invite_students_invite_id_idx
  on public.admin_invite_students (invite_id);

comment on table public.admin_invite_students is
  'Students attached to a parent AdminInvite. Claim links the parent to every attached student.';

create or replace function private.attach_anchor_invite_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'parent' and new.student_profile_id is not null then
    insert into public.admin_invite_students (invite_id, student_profile_id)
    values (new.id, new.student_profile_id)
    on conflict (invite_id, student_profile_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger admin_invites_attach_anchor_student
after insert on public.admin_invites
for each row
execute function private.attach_anchor_invite_student();

revoke all on function private.attach_anchor_invite_student() from public, anon, authenticated;

create or replace function public.normalize_admin_invite_student()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  invite_row public.admin_invites%rowtype;
  student_org bigint;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into invite_row
  from public.admin_invites
  where id = new.invite_id;

  if not found then
    raise exception 'This invite is missing or no longer valid.' using errcode = 'P0002';
  end if;

  if invite_row.role is distinct from 'parent' then
    raise exception 'Only parent invites can attach students.' using errcode = 'P0001';
  end if;

  if invite_row.accepted_at is not null then
    raise exception 'This invite was already accepted.' using errcode = 'P0001';
  end if;

  if not private.is_org_staff(invite_row.organization_id) then
    raise exception 'Only staff can invite parents.' using errcode = '42501';
  end if;

  select sp.organization_id into student_org
  from public.student_profiles sp
  where sp.id = new.student_profile_id;

  if student_org is distinct from invite_row.organization_id then
    raise exception 'That student is not in this organization.' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.parent_student_links psl
    join public.profiles p on p.id = psl.parent_user_id
    where psl.student_profile_id = new.student_profile_id
      and p.email = invite_row.email
  ) then
    raise exception 'That parent is already linked to this student.' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger admin_invite_students_normalize
before insert on public.admin_invite_students
for each row
execute function public.normalize_admin_invite_student();

create trigger student_profiles_set_updated_at
before update on public.student_profiles
for each row execute function private.set_updated_at();

create or replace function private.normalize_student_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  if new.parent_email is not null then
    new.parent_email := lower(btrim(new.parent_email));
    if new.parent_email = '' then
      new.parent_email := null;
    end if;
  end if;
  if new.student_email is not null then
    new.student_email := lower(btrim(new.student_email));
    if new.student_email = '' then
      new.student_email := null;
    end if;
  end if;
  if new.grade_level is not null then
    if not exists (
      select 1
      from public.organizations o
      where o.id = new.organization_id
        and new.grade_level = any (o.grade_labels)
    ) then
      raise exception 'grade_level must match the organization grade scheme';
    end if;
  end if;
  return new;
end;
$$;

create trigger student_profiles_normalize
before insert or update on public.student_profiles
for each row execute function private.normalize_student_profile();

create table public.families (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(display_name, ''))
  ) stored
);

create index families_organization_id_idx on public.families (organization_id);
create index families_search_idx on public.families using gin (search_vector);

comment on table public.families is 'SCHEMA.md Family';

create trigger families_set_updated_at
before update on public.families
for each row execute function private.set_updated_at();

create table public.family_members (
  id bigserial primary key,
  family_id bigint not null references public.families (id) on delete cascade,
  student_profile_id bigint references public.student_profiles (id) on delete cascade,
  parent_user_id uuid references public.profiles (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint family_members_subject_chk check (
    student_profile_id is not null or parent_user_id is not null
  )
);

create index family_members_family_id_idx on public.family_members (family_id);
create index family_members_student_profile_id_idx on public.family_members (student_profile_id);
create index family_members_parent_user_id_idx on public.family_members (parent_user_id);
create unique index family_members_student_uidx
  on public.family_members (student_profile_id)
  where student_profile_id is not null;
create unique index family_members_family_parent_uidx
  on public.family_members (family_id, parent_user_id)
  where parent_user_id is not null;

comment on table public.family_members is 'SCHEMA.md FamilyMember';

create table public.parent_student_links (
  id bigserial primary key,
  parent_user_id uuid not null references public.profiles (id) on delete cascade,
  student_profile_id bigint not null references public.student_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint parent_student_links_parent_student_key unique (parent_user_id, student_profile_id)
);

create index parent_student_links_parent_user_id_idx on public.parent_student_links (parent_user_id);
create index parent_student_links_student_profile_id_idx on public.parent_student_links (student_profile_id);

comment on table public.parent_student_links is 'SCHEMA.md ParentStudentLink';

create table public.enrollments (
  id bigserial primary key,
  student_profile_id bigint not null references public.student_profiles (id) on delete cascade,
  course_id bigint not null references public.courses (id) on delete cascade,
  status text not null default 'active',
  enrolled_at timestamptz not null default now(),
  constraint enrollments_status_chk check (status in ('active', 'completed', 'withdrawn')),
  constraint enrollments_student_course_key unique (student_profile_id, course_id)
);

create index enrollments_student_profile_id_idx on public.enrollments (student_profile_id);
create index enrollments_course_id_idx on public.enrollments (course_id);
create index enrollments_course_status_idx on public.enrollments (course_id, status);

comment on table public.enrollments is 'SCHEMA.md Enrollment';

-- ---------------------------------------------------------------------------
-- Class, ClassMember
-- ---------------------------------------------------------------------------

create table public.classes (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  title text not null,
  description text not null default '',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index classes_organization_id_idx on public.classes (organization_id);
create index classes_org_active_idx
  on public.classes (organization_id)
  where deleted_at is null;

comment on table public.classes is 'SCHEMA.md Class — org-scoped student group (not a course)';

create trigger classes_set_updated_at
before update on public.classes
for each row execute function private.set_updated_at();

create table public.class_members (
  id bigserial primary key,
  class_id bigint not null references public.classes (id) on delete cascade,
  student_profile_id bigint not null references public.student_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint class_members_class_student_key unique (class_id, student_profile_id)
);

create index class_members_class_id_idx on public.class_members (class_id);
create index class_members_student_profile_id_idx on public.class_members (student_profile_id);

comment on table public.class_members is 'SCHEMA.md ClassMember';

-- ---------------------------------------------------------------------------
-- File, FileVersion
-- ---------------------------------------------------------------------------

create table public.files (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  filename text not null,
  storage_ref text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  current_version int not null default 1,
  uploaded_by uuid not null references public.profiles (id),
  uploaded_at timestamptz not null default now(),
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(filename, ''))
  ) stored,
  constraint files_size_chk check (size_bytes >= 0),
  constraint files_current_version_chk check (current_version >= 1)
);

create index files_organization_id_idx on public.files (organization_id);
create index files_uploaded_by_idx on public.files (uploaded_by);
create index files_search_idx on public.files using gin (search_vector);

comment on table public.files is 'SCHEMA.md File';

create trigger files_set_updated_at
before update on public.files
for each row execute function private.set_updated_at();

create table public.file_versions (
  id bigserial primary key,
  file_id bigint not null references public.files (id) on delete cascade,
  version int not null,
  storage_ref text not null,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now(),
  change_type text not null,
  constraint file_versions_change_type_chk check (
    change_type in ('create', 'replace', 'restore', 'delete')
  ),
  constraint file_versions_file_version_key unique (file_id, version)
);

create index file_versions_file_id_idx on public.file_versions (file_id);
create index file_versions_changed_by_idx on public.file_versions (changed_by);

comment on table public.file_versions is 'SCHEMA.md FileVersion';

create or replace function private.file_versions_on_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.file_versions (
    file_id, version, storage_ref, filename, mime_type, size_bytes,
    changed_by, change_type
  ) values (
    new.id, new.current_version, new.storage_ref, new.filename, new.mime_type,
    new.size_bytes, new.uploaded_by, 'create'
  );
  return new;
end;
$$;

create trigger files_after_insert_version
after insert on public.files
for each row execute function private.file_versions_on_insert();

create or replace function private.file_versions_on_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ctype text;
begin
  if new.storage_ref is not distinct from old.storage_ref
     and new.filename is not distinct from old.filename
     and new.mime_type is not distinct from old.mime_type
     and new.size_bytes is not distinct from old.size_bytes
     and new.deleted_at is not distinct from old.deleted_at then
    return new;
  end if;

  if new.deleted_at is not null and old.deleted_at is null then
    ctype := 'delete';
  elsif old.deleted_at is not null and new.deleted_at is null then
    ctype := 'restore';
  else
    ctype := 'replace';
  end if;

  new.current_version := old.current_version + 1;

  insert into public.file_versions (
    file_id, version, storage_ref, filename, mime_type, size_bytes,
    changed_by, change_type
  ) values (
    new.id, new.current_version, new.storage_ref, new.filename, new.mime_type,
    new.size_bytes, (select auth.uid()), ctype
  );
  return new;
end;
$$;

create trigger files_before_update_version
before update on public.files
for each row execute function private.file_versions_on_update();

-- ---------------------------------------------------------------------------
-- Unit
-- ---------------------------------------------------------------------------

create table public.units (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  course_id bigint references public.courses (id) on delete cascade,
  template_id bigint references public.course_templates (id) on delete cascade,
  title text not null,
  start_date date,
  end_date date,
  position int not null default 0,
  copied_from_id bigint references public.units (id) on delete set null,
  is_overridden boolean not null default false,
  deleted_at timestamptz,
  deprecated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, ''))
  ) stored,
  constraint units_parent_xor_chk check (
    (course_id is not null and template_id is null)
    or (course_id is null and template_id is not null)
  ),
  constraint units_dates_chk check (end_date is null or start_date is null or end_date >= start_date)
);

create index units_organization_id_idx on public.units (organization_id);
create index units_course_id_idx on public.units (course_id);
create index units_template_id_idx on public.units (template_id);
create index units_copied_from_id_idx on public.units (copied_from_id);
create index units_course_position_idx
  on public.units (course_id, position)
  where deleted_at is null;
create index units_template_position_idx
  on public.units (template_id, position)
  where deleted_at is null;
create index units_search_idx on public.units using gin (search_vector);

comment on table public.units is 'SCHEMA.md Unit';

create trigger units_set_updated_at
before update on public.units
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Material (page | link | file), Block, MaterialVersion
-- ---------------------------------------------------------------------------

create table public.materials (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  course_id bigint references public.courses (id) on delete cascade,
  template_id bigint references public.course_templates (id) on delete cascade,
  unit_id bigint references public.units (id) on delete cascade,
  title text not null,
  description text not null default '',
  kind text not null,
  url text,
  file_id bigint references public.files (id) on delete set null,
  scheduled_date date,
  due_date date,
  position int not null default 0,
  visibility text not null default 'unpublished',
  copied_from_id bigint references public.materials (id) on delete set null,
  is_overridden boolean not null default false,
  status text not null default 'active',
  current_version int not null default 1,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  deprecated_at timestamptz,
  deprecated_by uuid references public.profiles (id) on delete set null,
  promoted_to_id bigint references public.materials (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(description, '')
    )
  ) stored,
  constraint materials_kind_chk check (kind in ('page', 'link', 'file')),
  constraint materials_status_chk check (status in ('active', 'deprecated')),
  constraint materials_parent_xor_chk check (
    (course_id is not null and template_id is null)
    or (course_id is null and template_id is not null)
  ),
  constraint materials_link_url_chk check (kind <> 'link' or url is not null),
  constraint materials_file_ref_chk check (kind <> 'file' or file_id is not null),
  constraint materials_current_version_chk check (current_version >= 1),
  constraint materials_visibility_chk check (visibility in ('published', 'unpublished'))
);

create index materials_organization_id_idx on public.materials (organization_id);
create index materials_course_id_idx on public.materials (course_id);
create index materials_template_id_idx on public.materials (template_id);
create index materials_unit_id_idx on public.materials (unit_id);
create index materials_file_id_idx on public.materials (file_id);
create index materials_copied_from_id_idx on public.materials (copied_from_id);
create index materials_kind_idx on public.materials (kind);
create index materials_scheduled_date_idx on public.materials (scheduled_date);
create index materials_course_top_level_idx
  on public.materials (course_id, scheduled_date)
  where unit_id is null and deleted_at is null;
create index materials_unit_position_idx
  on public.materials (unit_id, position)
  where deleted_at is null;
create index materials_course_toplevel_position_idx
  on public.materials (course_id, position)
  where unit_id is null and deleted_at is null;
create index materials_course_published_idx
  on public.materials (course_id)
  where deleted_at is null and visibility = 'published';
create index materials_search_idx on public.materials using gin (search_vector);

comment on table public.materials is 'SCHEMA.md Material — page (blocks) | link | file; unit_id null = course/template top-level';
comment on column public.materials.visibility is
  'published = enrolled parents (and students later); unpublished = instructors/admins only';
comment on column public.materials.due_date is
  'Optional due date for parents/instructors. Distinct from scheduled_date (assignment / this-week date).';


create trigger materials_set_updated_at
before update on public.materials
for each row execute function private.set_updated_at();

create or replace function private.materials_align_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  u public.units%rowtype;
  org_id bigint;
begin
  if new.unit_id is not null then
    select * into u from public.units where id = new.unit_id;
    if not found then
      raise exception 'unit not found';
    end if;
    new.organization_id := u.organization_id;
    new.course_id := u.course_id;
    new.template_id := u.template_id;
    return new;
  end if;

  -- Top-level material: require course XOR template already set.
  if new.course_id is not null and new.template_id is not null then
    raise exception 'materials require exactly one of course_id or template_id when unit_id is null';
  end if;
  if new.course_id is null and new.template_id is null then
    raise exception 'materials require course_id or template_id when unit_id is null';
  end if;

  if new.course_id is not null then
    select c.organization_id into org_id
    from public.courses c
    where c.id = new.course_id;
    if not found then
      raise exception 'course not found';
    end if;
  else
    select t.organization_id into org_id
    from public.course_templates t
    where t.id = new.template_id;
    if not found then
      raise exception 'course template not found';
    end if;
  end if;

  new.organization_id := org_id;
  return new;
end;
$$;

create trigger materials_align_parent
before insert or update of unit_id, course_id, template_id, organization_id on public.materials
for each row execute function private.materials_align_parent();

create table public.blocks (
  id bigserial primary key,
  material_id bigint not null references public.materials (id) on delete cascade,
  position int not null default 0,
  kind text not null,
  body jsonb not null default '{}'::jsonb,
  file_id bigint references public.files (id) on delete set null,
  copied_from_id bigint references public.blocks (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blocks_kind_chk check (kind in ('rich_text', 'video'))
);

create index blocks_material_id_idx on public.blocks (material_id);
create index blocks_file_id_idx on public.blocks (file_id);
create index blocks_copied_from_id_idx on public.blocks (copied_from_id);
create index blocks_material_position_idx
  on public.blocks (material_id, position)
  where deleted_at is null;

comment on table public.blocks is 'SCHEMA.md Block — ordered content on page materials only';

create trigger blocks_set_updated_at
before update on public.blocks
for each row execute function private.set_updated_at();

create or replace function private.blocks_require_page_material()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  material_kind text;
begin
  select m.kind into material_kind
  from public.materials m
  where m.id = new.material_id;
  if not found then
    raise exception 'material not found';
  end if;
  if material_kind is distinct from 'page' then
    raise exception 'blocks can only belong to materials with kind = page';
  end if;
  return new;
end;
$$;

create trigger blocks_require_page_material
before insert or update of material_id on public.blocks
for each row execute function private.blocks_require_page_material();

create table public.material_versions (
  id bigserial primary key,
  material_id bigint not null references public.materials (id) on delete cascade,
  version int not null,
  snapshot jsonb not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now(),
  change_type text not null,
  constraint material_versions_change_type_chk check (
    change_type in ('create', 'update', 'delete', 'restore', 'sync', 'promote', 'deprecate')
  ),
  constraint material_versions_material_version_key unique (material_id, version)
);

create index material_versions_material_id_idx on public.material_versions (material_id);
create index material_versions_changed_by_idx on public.material_versions (changed_by);

comment on table public.material_versions is 'SCHEMA.md MaterialVersion — snapshot includes material row + blocks array';

create or replace function private.material_page_snapshot(p_material_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'material', to_jsonb(m),
    'blocks', coalesce(
      (
        select jsonb_agg(to_jsonb(b) order by b.position, b.id)
        from public.blocks b
        where b.material_id = p_material_id
          and b.deleted_at is null
      ),
      '[]'::jsonb
    )
  )
  from public.materials m
  where m.id = p_material_id;
$$;

create or replace function private.material_change_type(
  old_row public.materials,
  new_row public.materials
)
returns text
language sql
immutable
as $$
  select case
    when old_row is null then 'create'
    when new_row.deleted_at is not null and old_row.deleted_at is null then 'delete'
    when old_row.deleted_at is not null and new_row.deleted_at is null then 'restore'
    when new_row.deprecated_at is not null and old_row.deprecated_at is null then 'deprecate'
    when new_row.promoted_to_id is not null and old_row.promoted_to_id is null then 'promote'
    else 'update'
  end;
$$;

create or replace function private.material_versions_on_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.material_versions (material_id, version, snapshot, changed_by, change_type)
  values (
    new.id,
    new.current_version,
    private.material_page_snapshot(new.id),
    (select auth.uid()),
    'create'
  );
  return new;
end;
$$;

create trigger materials_after_insert_version
after insert on public.materials
for each row execute function private.material_versions_on_insert();

create or replace function private.material_versions_on_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('coursewright.skip_version', true) = 'on' then
    return new;
  end if;
  if to_jsonb(new) - 'updated_at' - 'current_version' - 'search_vector'
     is not distinct from to_jsonb(old) - 'updated_at' - 'current_version' - 'search_vector' then
    return new;
  end if;
  new.current_version := old.current_version + 1;
  insert into public.material_versions (material_id, version, snapshot, changed_by, change_type)
  values (
    new.id,
    new.current_version,
    -- Snapshot uses NEW column values; material row is read after this BEFORE trigger
    -- via building from new + live blocks (blocks unchanged on material-only edits).
    jsonb_build_object(
      'material', to_jsonb(new),
      'blocks', coalesce(
        (
          select jsonb_agg(to_jsonb(b) order by b.position, b.id)
          from public.blocks b
          where b.material_id = new.id
            and b.deleted_at is null
        ),
        '[]'::jsonb
      )
    ),
    coalesce((select auth.uid()), new.deleted_by, new.deprecated_by),
    private.material_change_type(old, new)
  );
  return new;
end;
$$;

create trigger materials_before_update_version
before update on public.materials
for each row execute function private.material_versions_on_update();

-- Block changes also bump the parent material version (snapshot includes blocks).
-- Updating only current_version on materials is ignored by material_versions_on_update.
create or replace function private.blocks_version_parent_material()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  mid bigint;
  new_version int;
begin
  if current_setting('coursewright.skip_version', true) = 'on' then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE'
     and to_jsonb(new) - 'updated_at'
         is not distinct from to_jsonb(old) - 'updated_at' then
    return new;
  end if;

  mid := coalesce(new.material_id, old.material_id);

  update public.materials m
  set current_version = m.current_version + 1
  where m.id = mid
  returning m.current_version into new_version;

  if new_version is null then
    return coalesce(new, old);
  end if;

  insert into public.material_versions (material_id, version, snapshot, changed_by, change_type)
  values (
    mid,
    new_version,
    private.material_page_snapshot(mid),
    (select auth.uid()),
    'update'
  );

  return coalesce(new, old);
end;
$$;

create trigger blocks_after_change_version
after insert or update or delete on public.blocks
for each row execute function private.blocks_version_parent_material();

-- ---------------------------------------------------------------------------
-- ShareLink, ImportantNow
-- ---------------------------------------------------------------------------

create table public.share_links (
  id bigserial primary key,
  token text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  link_type text not null,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  course_id bigint references public.courses (id) on delete cascade,
  student_profile_id bigint references public.student_profiles (id) on delete cascade,
  material_id bigint references public.materials (id) on delete cascade,
  parent_invite_id bigint references public.admin_invites (id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint share_links_link_type_chk check (link_type in ('invite', 'dashboard', 'resource')),
  constraint share_links_token_key unique (token),
  constraint share_links_resource_chk check (
    link_type <> 'resource' or material_id is not null
  )
);

create index share_links_organization_id_idx on public.share_links (organization_id);
create index share_links_course_id_idx on public.share_links (course_id);
create index share_links_student_profile_id_idx on public.share_links (student_profile_id);
create index share_links_material_id_idx on public.share_links (material_id);
create index share_links_parent_invite_id_idx on public.share_links (parent_invite_id);

comment on table public.share_links is 'SCHEMA.md ShareLink';

create table public.important_now (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  course_id bigint not null references public.courses (id) on delete cascade,
  material_id bigint not null references public.materials (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint important_now_course_material_key unique (course_id, material_id)
);

create index important_now_organization_id_idx on public.important_now (organization_id);
create index important_now_course_id_idx on public.important_now (course_id);
create index important_now_material_id_idx on public.important_now (material_id);
create index important_now_created_by_idx on public.important_now (created_by);

comment on table public.important_now is 'SCHEMA.md ImportantNow';

-- ---------------------------------------------------------------------------
-- RLS helper functions (private schema is not exposed to PostgREST)
-- ---------------------------------------------------------------------------

create or replace function private.is_org_owner(p_org_id bigint)
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
      and m.role = 'owner'
      and m.status = 'active'
  );
$$;

create or replace function private.is_org_admin(p_org_id bigint)
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
      and m.role in ('owner', 'admin')
      and m.status = 'active'
  );
$$;

create or replace function private.is_org_staff(p_org_id bigint)
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
      and m.role in ('owner', 'admin', 'instructor')
      and m.status = 'active'
  );
$$;

create or replace function private.is_org_member(p_org_id bigint)
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
      and m.status = 'active'
  );
$$;

create or replace function private.shares_org_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs
      on theirs.organization_id = mine.organization_id
    where mine.user_id = (select auth.uid())
      and mine.status = 'active'
      and theirs.user_id = p_user_id
      and theirs.status = 'active'
  );
$$;

create or replace function private.is_course_instructor(p_course_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_instructors ci
    where ci.course_id = p_course_id
      and ci.user_id = (select auth.uid())
  );
$$;

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

create or replace function private.template_permission(p_template_id bigint)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select ta.permission
  from public.template_access ta
  where ta.template_id = p_template_id
    and ta.user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.can_view_template(p_template_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_templates t
    where t.id = p_template_id
      and (
        private.is_org_admin(t.organization_id)
        or private.template_permission(t.id) is not null
      )
  );
$$;

create or replace function private.can_edit_template(p_template_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_templates t
    where t.id = p_template_id
      and (
        private.is_org_admin(t.organization_id)
        or private.template_permission(t.id) in ('owner', 'edit')
      )
  );
$$;

-- SCHEMA.md parent access gate: parent membership + linked student +
-- enrollment in a course with status = active.
create or replace function private.parent_can_view_course(p_course_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.courses c
    join public.enrollments e
      on e.course_id = c.id
     and e.status = 'active'
    join public.parent_student_links psl
      on psl.student_profile_id = e.student_profile_id
     and psl.parent_user_id = (select auth.uid())
    join public.memberships m
      on m.organization_id = c.organization_id
     and m.user_id = (select auth.uid())
     and m.role = 'parent'
     and m.status = 'active'
    where c.id = p_course_id
      and c.status = 'active'
      and c.visibility = 'published'
  );
$$;

create or replace function private.parent_linked_to_student(p_student_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.parent_student_links psl
    where psl.student_profile_id = p_student_id
      and psl.parent_user_id = (select auth.uid())
  );
$$;

create or replace function private.parent_can_view_material(p_material_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.materials m
    where m.id = p_material_id
      and m.course_id is not null
      and m.deleted_at is null
      and m.visibility = 'published'
      and private.parent_can_view_course(m.course_id)
  );
$$;

create or replace function private.parent_can_view_file(p_file_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.materials m
    where m.file_id = p_file_id
      and m.course_id is not null
      and m.deleted_at is null
      and m.visibility = 'published'
      and private.parent_can_view_course(m.course_id)
  )
  or exists (
    select 1
    from public.blocks b
    join public.materials m on m.id = b.material_id
    where b.file_id = p_file_id
      and b.deleted_at is null
      and m.course_id is not null
      and m.deleted_at is null
      and m.visibility = 'published'
      and private.parent_can_view_course(m.course_id)
  );
$$;


-- ---------------------------------------------------------------------------
-- Invite claim helpers / RPCs (membership is created on claim)
-- ---------------------------------------------------------------------------

create or replace function private.current_profile_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.email
  from public.profiles p
  where p.id = (select auth.uid());
$$;

create or replace function private.has_pending_invite_for_me(p_organization_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_invites i
    where i.organization_id = p_organization_id
      and i.accepted_at is null
      and i.email = private.current_profile_email()
  );
$$;

revoke all on function private.current_profile_email() from public, anon, authenticated;
revoke all on function private.has_pending_invite_for_me(bigint) from public, anon, authenticated;
grant execute on function private.current_profile_email() to authenticated, service_role;
grant execute on function private.has_pending_invite_for_me(bigint) to authenticated, service_role;

create or replace function public.normalize_org_invite()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  student_org bigint;
begin
  new.email := lower(trim(new.email));
  if new.email is null or new.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address.' using errcode = 'P0001';
  end if;

  if new.role not in ('owner', 'admin', 'instructor', 'parent') then
    raise exception 'Choose a valid invite role.' using errcode = 'P0001';
  end if;

  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if new.invited_by is null then
    new.invited_by := (select auth.uid());
  end if;

  if new.role = 'parent' then
    if new.student_profile_id is null then
      raise exception 'Choose a student to invite this parent for.' using errcode = 'P0001';
    end if;

    if not private.is_org_staff(new.organization_id) then
      raise exception 'Only staff can invite parents.' using errcode = '42501';
    end if;

    select sp.organization_id into student_org
    from public.student_profiles sp
    where sp.id = new.student_profile_id;

    if student_org is distinct from new.organization_id then
      raise exception 'That student is not in this organization.' using errcode = 'P0001';
    end if;

    if exists (
      select 1
      from public.parent_student_links psl
      join public.profiles p on p.id = psl.parent_user_id
      where psl.student_profile_id = new.student_profile_id
        and p.email = new.email
    ) then
      raise exception 'That parent is already linked to this student.' using errcode = 'P0001';
    end if;

    if tg_op = 'INSERT' and exists (
      select 1
      from public.admin_invites i
      where i.organization_id = new.organization_id
        and i.email = new.email
        and i.role = 'parent'
        and i.accepted_at is null
    ) then
      raise exception 'That email already has a pending invite.' using errcode = 'P0001';
    end if;
  else
    new.student_profile_id := null;

    if not private.is_org_admin(new.organization_id) then
      raise exception 'Only owners and admins can invite collaborators.' using errcode = '42501';
    end if;

    if new.role = 'owner' and not private.is_org_owner(new.organization_id) then
      raise exception 'Only an owner can invite another owner.' using errcode = '42501';
    end if;

    if exists (
      select 1
      from public.memberships m
      join public.profiles p on p.id = m.user_id
      where m.organization_id = new.organization_id
        and m.status = 'active'
        and p.email = new.email
    ) then
      raise exception 'That person is already in this organization.' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger admin_invites_normalize
  before insert or update of email, role, organization_id, invited_by, student_profile_id
  on public.admin_invites
  for each row
  execute function public.normalize_org_invite();

create or replace function public.get_invite(p_token text)
returns table (
  id bigint,
  organization_id bigint,
  organization_name text,
  organization_slug text,
  email text,
  role text,
  student_profile_id bigint,
  student_name text,
  accepted_at timestamptz,
  email_matches boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  caller_email text;
begin
  if caller is not null then
    select p.email into caller_email
    from public.profiles p
    where p.id = caller;
  end if;

  return query
  select
    i.id,
    i.organization_id,
    o.name,
    o.slug,
    i.email,
    i.role,
    i.student_profile_id,
    sp.name,
    i.accepted_at,
    ((caller_email is not null) and (i.email = caller_email)) as email_matches
  from public.admin_invites i
  join public.organizations o on o.id = i.organization_id
  left join public.student_profiles sp on sp.id = i.student_profile_id
  where i.token = p_token;
end;
$$;

create or replace function public.claim_invite(p_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  caller_email text;
  invite public.admin_invites%rowtype;
  member_id bigint;
  member_role text;
  org_slug text;
begin
  if caller is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into invite
  from public.admin_invites
  where token = p_token
  for update;

  if not found then
    raise exception 'This invite is missing or no longer valid.' using errcode = 'P0002';
  end if;

  select o.slug into org_slug
  from public.organizations o
  where o.id = invite.organization_id;

  select p.email into caller_email
  from public.profiles p
  where p.id = caller;

  if caller_email is distinct from invite.email then
    raise exception 'Sign in with the invited email to accept.' using errcode = 'P0001';
  end if;

  if invite.role = 'parent' then
    if invite.student_profile_id is null then
      raise exception 'This invite is missing or no longer valid.' using errcode = 'P0002';
    end if;

    if exists (
      select 1
      from public.admin_invite_students ais
      where ais.invite_id = invite.id
    ) then
      insert into public.parent_student_links (parent_user_id, student_profile_id)
      select caller, ais.student_profile_id
      from public.admin_invite_students ais
      where ais.invite_id = invite.id
      on conflict (parent_user_id, student_profile_id) do nothing;
    else
      insert into public.parent_student_links (parent_user_id, student_profile_id)
      values (caller, invite.student_profile_id)
      on conflict (parent_user_id, student_profile_id) do nothing;
    end if;
  end if;

  select m.id, m.role into member_id, member_role
  from public.memberships m
  where m.organization_id = invite.organization_id
    and m.user_id = caller
    and m.status = 'active';

  if member_id is not null then
    if invite.role in ('owner', 'admin', 'instructor')
       and member_role = 'parent' then
      update public.memberships
      set role = invite.role
      where id = member_id;
    end if;

    if invite.accepted_at is null then
      update public.admin_invites
      set accepted_at = now(), membership_id = member_id
      where id = invite.id;
    end if;
    return org_slug;
  end if;

  if invite.accepted_at is not null then
    raise exception 'This invite was already accepted.' using errcode = 'P0001';
  end if;

  insert into public.memberships (organization_id, user_id, role, status)
  values (invite.organization_id, caller, invite.role, 'active')
  returning id into member_id;

  update public.admin_invites
  set accepted_at = now(), membership_id = member_id
  where id = invite.id;

  return org_slug;
end;
$$;

create or replace function public.get_staff_invite(p_token text)
returns table (
  id bigint,
  organization_id bigint,
  organization_name text,
  organization_slug text,
  email text,
  role text,
  student_profile_id bigint,
  student_name text,
  accepted_at timestamptz,
  email_matches boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.get_invite(p_token);
$$;

create or replace function public.claim_staff_invite(p_token text)
returns text
language sql
security definer
set search_path = ''
as $$
  select public.claim_invite(p_token);
$$;

revoke all on function public.get_invite(text) from public;
grant execute on function public.get_invite(text) to anon, authenticated;

revoke all on function public.claim_invite(text) from public, anon;
grant execute on function public.claim_invite(text) to authenticated;

revoke all on function public.get_staff_invite(text) from public, anon;
grant execute on function public.get_staff_invite(text) to authenticated;

revoke all on function public.claim_staff_invite(text) from public, anon;
grant execute on function public.claim_staff_invite(text) to authenticated;

revoke all on function public.normalize_org_invite() from public, anon;
grant execute on function public.normalize_org_invite() to authenticated;

-- ---------------------------------------------------------------------------
-- save_material_page
-- ---------------------------------------------------------------------------

create or replace function public.save_material_page(
  p_material_id bigint,
  p_placement jsonb default null,
  p_blocks jsonb default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  material public.materials%rowtype;
  next_title text;
  next_description text;
  next_url text;
  next_scheduled date;
  next_due date;
  placement_changed boolean := false;
  current_blocks jsonb;
  next_blocks jsonb;
  blocks_changed boolean := false;
  new_version int;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to save.' using errcode = '42501';
  end if;

  select * into material
  from public.materials
  where id = p_material_id;

  if not found then
    raise exception 'That material isn’t there.' using errcode = 'P0002';
  end if;

  if material.course_id is not null then
    if not private.can_manage_course(material.course_id) then
      raise exception 'You can’t edit this material.' using errcode = '42501';
    end if;
  elsif material.template_id is not null then
    if not private.can_edit_template(material.template_id) then
      raise exception 'You can’t edit this material.' using errcode = '42501';
    end if;
  else
    raise exception 'You can’t edit this material.' using errcode = '42501';
  end if;

  if p_placement is not null then
    next_title := coalesce(p_placement->>'title', material.title);
    next_description := coalesce(p_placement->>'description', material.description);
    if material.kind = 'link' then
      next_url := p_placement->>'url';
    else
      next_url := material.url;
    end if;
    if jsonb_exists(p_placement, 'scheduled_date') then
      next_scheduled := nullif(p_placement->>'scheduled_date', '')::date;
    else
      next_scheduled := material.scheduled_date;
    end if;
    if jsonb_exists(p_placement, 'due_date') then
      next_due := nullif(p_placement->>'due_date', '')::date;
    else
      next_due := material.due_date;
    end if;
    placement_changed :=
      next_title is distinct from material.title
      or next_description is distinct from material.description
      or next_url is distinct from material.url
      or next_scheduled is distinct from material.scheduled_date
      or next_due is distinct from material.due_date;
  end if;

  if p_blocks is not null then
    if material.kind <> 'page' then
      raise exception 'Only page materials have lesson content.' using errcode = 'P0001';
    end if;
    if jsonb_typeof(p_blocks) <> 'array' then
      raise exception 'Page content is not in a shape we can save.' using errcode = 'P0001';
    end if;

    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'kind', b.kind,
            'body', b.body,
            'position', b.position,
            'file_id', b.file_id
          )
          order by b.position, b.id
        )
        from public.blocks b
        where b.material_id = p_material_id
          and b.deleted_at is null
      ),
      '[]'::jsonb
    )
    into current_blocks;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'kind', elem->>'kind',
          'body', coalesce(elem->'body', '{}'::jsonb),
          'position', coalesce((elem->>'position')::int, (ord - 1)::int),
          'file_id', case
            when elem->>'file_id' ~ '^[0-9]+$' then (elem->>'file_id')::bigint
            else null
          end
        )
        order by coalesce((elem->>'position')::int, (ord - 1)::int), ord
      ),
      '[]'::jsonb
    )
    into next_blocks
    from jsonb_array_elements(p_blocks) with ordinality as t(elem, ord);

    if exists (
      select 1
      from jsonb_array_elements(p_blocks) as elem
      where coalesce(elem->>'kind', '') not in ('rich_text', 'video')
    ) then
      raise exception 'That block type isn’t supported yet.' using errcode = 'P0001';
    end if;

    blocks_changed := current_blocks is distinct from next_blocks;
  end if;

  if not placement_changed and not blocks_changed then
    return material.current_version;
  end if;

  perform set_config('coursewright.skip_version', 'on', true);

  if placement_changed then
    update public.materials
    set
      title = next_title,
      description = next_description,
      url = next_url,
      scheduled_date = next_scheduled,
      due_date = next_due
    where id = p_material_id;
  end if;

  if blocks_changed then
    update public.blocks
    set deleted_at = now()
    where material_id = p_material_id
      and deleted_at is null;

    insert into public.blocks (material_id, kind, body, position, file_id)
    select
      p_material_id,
      elem->>'kind',
      coalesce(elem->'body', '{}'::jsonb),
      coalesce((elem->>'position')::int, (ord - 1)::int),
      case
        when elem->>'file_id' ~ '^[0-9]+$' then (elem->>'file_id')::bigint
        else null
      end
    from jsonb_array_elements(p_blocks) with ordinality as t(elem, ord);
  end if;

  update public.materials m
  set current_version = m.current_version + 1
  where m.id = p_material_id
  returning m.current_version into new_version;

  insert into public.material_versions (material_id, version, snapshot, changed_by, change_type)
  values (
    p_material_id,
    new_version,
    private.material_page_snapshot(p_material_id),
    (select auth.uid()),
    'update'
  );

  return new_version;
end;
$$;

revoke all on function public.save_material_page(bigint, jsonb, jsonb) from public, anon;
grant execute on function public.save_material_page(bigint, jsonb, jsonb) to authenticated;

comment on function public.save_material_page(bigint, jsonb, jsonb) is
  'Save material placement and/or page blocks; insert one material_versions row only when something changed.';

-- ---------------------------------------------------------------------------
-- Lesson plans
-- ---------------------------------------------------------------------------

create table public.lesson_plans (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  course_id bigint not null references public.courses (id) on delete cascade,
  week_start date not null,
  title text not null,
  week_note text not null default '',
  visibility text not null default 'unpublished',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id),
  constraint lesson_plans_title_chk check (char_length(btrim(title)) > 0),
  constraint lesson_plans_visibility_chk check (visibility in ('published', 'unpublished')),
  constraint lesson_plans_week_start_sunday_chk check (extract(dow from week_start) = 0)
);

create unique index lesson_plans_course_week_uidx
  on public.lesson_plans (course_id, week_start)
  where deleted_at is null;

create index lesson_plans_organization_id_idx on public.lesson_plans (organization_id);
create index lesson_plans_course_id_idx on public.lesson_plans (course_id)
  where deleted_at is null;
create index lesson_plans_created_by_idx on public.lesson_plans (created_by);

create trigger lesson_plans_set_updated_at
before update on public.lesson_plans
for each row execute function private.set_updated_at();

comment on table public.lesson_plans is
  'SCHEMA.md LessonPlan — weekly course plan; published / unpublished';
comment on column public.lesson_plans.week_start is
  'Sunday of the Sunday–Saturday week this plan covers';

create table public.lesson_plan_days (
  id bigserial primary key,
  lesson_plan_id bigint not null references public.lesson_plans (id) on delete cascade,
  day_date date not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_plan_days_plan_day_key unique (lesson_plan_id, day_date)
);

create index lesson_plan_days_lesson_plan_id_idx
  on public.lesson_plan_days (lesson_plan_id, day_date);

create trigger lesson_plan_days_set_updated_at
before update on public.lesson_plan_days
for each row execute function private.set_updated_at();

comment on table public.lesson_plan_days is
  'SCHEMA.md LessonPlanDay — optional note for one day in a lesson plan';

create or replace function private.lesson_plan_day_in_week()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  plan_start date;
begin
  select lp.week_start into plan_start
  from public.lesson_plans lp
  where lp.id = new.lesson_plan_id;

  if plan_start is null
     or new.day_date < plan_start
     or new.day_date > (plan_start + 6) then
    raise exception 'That day needs to be in the same week as this lesson plan.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger lesson_plan_days_in_week
before insert or update on public.lesson_plan_days
for each row execute function private.lesson_plan_day_in_week();

create table public.lesson_plan_day_materials (
  id bigserial primary key,
  lesson_plan_day_id bigint not null references public.lesson_plan_days (id) on delete cascade,
  material_id bigint not null references public.materials (id) on delete cascade,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint lesson_plan_day_materials_day_material_key
    unique (lesson_plan_day_id, material_id)
);

create index lesson_plan_day_materials_day_id_idx
  on public.lesson_plan_day_materials (lesson_plan_day_id, position);
create index lesson_plan_day_materials_material_id_idx
  on public.lesson_plan_day_materials (material_id);

comment on table public.lesson_plan_day_materials is
  'SCHEMA.md LessonPlanDayMaterial — materials listed under a lesson-plan day';

create or replace function private.lesson_plan_day_material_same_course()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  plan_course bigint;
  material_course bigint;
begin
  select lp.course_id into plan_course
  from public.lesson_plan_days d
  join public.lesson_plans lp on lp.id = d.lesson_plan_id
  where d.id = new.lesson_plan_day_id;

  select m.course_id into material_course
  from public.materials m
  where m.id = new.material_id;

  if plan_course is null or material_course is null
     or plan_course is distinct from material_course then
    raise exception 'Those materials need to be in the same course as this lesson plan.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger lesson_plan_day_materials_same_course
before insert or update on public.lesson_plan_day_materials
for each row execute function private.lesson_plan_day_material_same_course();

-- ---------------------------------------------------------------------------
-- Announcements (multi-target arrays)
-- ---------------------------------------------------------------------------

create table public.announcements (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  audience text not null,
  course_ids bigint[] not null default '{}',
  class_ids bigint[] not null default '{}',
  student_profile_ids bigint[] not null default '{}',
  title text not null,
  body text not null default '',
  start_date date,
  end_date date,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id),
  constraint announcements_title_chk check (char_length(btrim(title)) > 0),
  constraint announcements_audience_chk check (audience in ('course', 'class', 'student')),
  constraint announcements_audience_targets_chk check (
    (
      audience = 'course'
      and cardinality(course_ids) >= 1
      and class_ids = '{}'::bigint[]
      and student_profile_ids = '{}'::bigint[]
    )
    or (
      audience = 'class'
      and cardinality(class_ids) >= 1
      and course_ids = '{}'::bigint[]
      and student_profile_ids = '{}'::bigint[]
    )
    or (
      audience = 'student'
      and cardinality(student_profile_ids) >= 1
      and course_ids = '{}'::bigint[]
      and class_ids = '{}'::bigint[]
    )
  ),
  constraint announcements_date_range_chk check (
    start_date is null
    or end_date is null
    or end_date >= start_date
  )
);

create index announcements_organization_id_idx
  on public.announcements (organization_id)
  where deleted_at is null;
create index announcements_course_ids_gin
  on public.announcements using gin (course_ids)
  where deleted_at is null and audience = 'course';
create index announcements_class_ids_gin
  on public.announcements using gin (class_ids)
  where deleted_at is null and audience = 'class';
create index announcements_student_profile_ids_gin
  on public.announcements using gin (student_profile_ids)
  where deleted_at is null and audience = 'student';
create index announcements_created_by_idx on public.announcements (created_by);

create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function private.set_updated_at();

comment on table public.announcements is
  'SCHEMA.md Announcement — one-way notice to one or more courses, classes, or students';
comment on column public.announcements.start_date is
  'First local calendar day families see this on home (inclusive); null = already current';
comment on column public.announcements.end_date is
  'Last local calendar day families see this on home (inclusive); null = until removed';
comment on column public.announcements.course_ids is
  'Course targets when audience = course (one or more)';
comment on column public.announcements.class_ids is
  'Class targets when audience = class (one or more)';
comment on column public.announcements.student_profile_ids is
  'Student targets when audience = student (one or more)';

create or replace function private.announcement_targets_in_org()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_id bigint;
  target_org bigint;
begin
  if new.audience = 'course' then
    foreach target_id in array new.course_ids loop
      select c.organization_id into target_org
      from public.courses c
      where c.id = target_id;
      if target_org is null or target_org is distinct from new.organization_id then
        raise exception 'That audience needs to be in this organization.'
          using errcode = '23514';
      end if;
    end loop;
  elsif new.audience = 'class' then
    foreach target_id in array new.class_ids loop
      select c.organization_id into target_org
      from public.classes c
      where c.id = target_id;
      if target_org is null or target_org is distinct from new.organization_id then
        raise exception 'That audience needs to be in this organization.'
          using errcode = '23514';
      end if;
    end loop;
  else
    foreach target_id in array new.student_profile_ids loop
      select s.organization_id into target_org
      from public.student_profiles s
      where s.id = target_id;
      if target_org is null or target_org is distinct from new.organization_id then
        raise exception 'That audience needs to be in this organization.'
          using errcode = '23514';
      end if;
    end loop;
  end if;

  return new;
end;
$$;

create trigger announcements_targets_in_org
before insert or update on public.announcements
for each row execute function private.announcement_targets_in_org();

create table public.announcement_reads (
  id bigserial primary key,
  announcement_id bigint not null references public.announcements (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  constraint announcement_reads_announcement_user_key unique (announcement_id, user_id)
);

create index announcement_reads_user_id_idx
  on public.announcement_reads (user_id);
create index announcement_reads_announcement_id_idx
  on public.announcement_reads (announcement_id);

comment on table public.announcement_reads is
  'SCHEMA.md AnnouncementRead — per-user read receipt';

create or replace function private.can_post_announcement(
  p_org_id bigint,
  p_audience text,
  p_course_ids bigint[],
  p_class_ids bigint[],
  p_student_ids bigint[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    case p_audience
      when 'course' then
        cardinality(p_course_ids) >= 1
        and (
          select bool_and(private.can_manage_course(cid))
          from unnest(p_course_ids) as cid
        )
      when 'class' then
        private.is_org_staff(p_org_id)
        and cardinality(p_class_ids) >= 1
        and (
          select bool_and(
            exists (
              select 1
              from public.classes c
              where c.id = cid
                and c.organization_id = p_org_id
                and c.deleted_at is null
            )
          )
          from unnest(p_class_ids) as cid
        )
      when 'student' then
        private.is_org_staff(p_org_id)
        and cardinality(p_student_ids) >= 1
        and (
          select bool_and(
            exists (
              select 1
              from public.student_profiles s
              where s.id = sid
                and s.organization_id = p_org_id
            )
          )
          from unnest(p_student_ids) as sid
        )
      else false
    end;
$$;

-- Bypass RLS so class parent-select does not recurse through class_members → classes.
create or replace function private.parent_linked_to_class(p_class_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_members cm
    join public.parent_student_links psl
      on psl.student_profile_id = cm.student_profile_id
     and psl.parent_user_id = (select auth.uid())
    where cm.class_id = p_class_id
  );
$$;

create or replace function private.parent_can_view_announcement(p_announcement_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.announcements a
    join public.memberships m
      on m.organization_id = a.organization_id
     and m.user_id = (select auth.uid())
     and m.role = 'parent'
     and m.status = 'active'
    where a.id = p_announcement_id
      and (
        (
          a.audience = 'course'
          and exists (
            select 1
            from unnest(a.course_ids) as cid
            where private.parent_can_view_course(cid)
          )
        )
        or (
          a.audience = 'class'
          and exists (
            select 1
            from unnest(a.class_ids) as cid
            where private.parent_linked_to_class(cid)
              and exists (
                select 1
                from public.classes c
                where c.id = cid
                  and c.organization_id = a.organization_id
                  and c.deleted_at is null
              )
          )
        )
        or (
          a.audience = 'student'
          and exists (
            select 1
            from unnest(a.student_profile_ids) as sid
            where private.parent_linked_to_student(sid)
          )
        )
      )
  );
$$;

grant usage on schema private to authenticated, service_role;

grant execute on all functions in schema private to authenticated, service_role;
