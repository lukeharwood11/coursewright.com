-- P0 schema translated from docs/database/SCHEMA.md
-- App entity PKs are bigserial; profiles.id stays uuid (= auth.users.id).
-- Do not add extra entities here. RLS policies live in a separate migration.

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
  constraint organizations_org_type_chk check (org_type in ('coop', 'micro_school')),
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
  created_at timestamptz not null default now(),
  constraint admin_invites_email_lower_chk check (email = lower(email)),
  constraint admin_invites_token_key unique (token)
);

create index admin_invites_organization_id_idx on public.admin_invites (organization_id);
create index admin_invites_email_idx on public.admin_invites (email);
create unique index admin_invites_pending_org_email_uidx
  on public.admin_invites (organization_id, email)
  where accepted_at is null;

comment on table public.admin_invites is 'SCHEMA.md AdminInvite';

create or replace function private.admin_invites_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  mid bigint;
begin
  new.email := lower(new.email);
  insert into public.memberships (organization_id, user_id, role, status)
  values (new.organization_id, null, 'admin', 'invited')
  returning id into mid;
  new.membership_id := mid;
  return new;
end;
$$;

create trigger admin_invites_before_insert
before insert on public.admin_invites
for each row execute function private.admin_invites_before_insert();

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored,
  constraint courses_status_chk check (status in ('active', 'archived')),
  constraint courses_dates_chk check (end_date is null or start_date is null or end_date >= start_date)
);

create index courses_organization_id_idx on public.courses (organization_id);
create index courses_template_id_idx on public.courses (template_id);
create index courses_copied_from_course_id_idx on public.courses (copied_from_course_id);
create index courses_status_idx on public.courses (organization_id, status);
create index courses_search_idx on public.courses using gin (search_vector);

comment on table public.courses is 'SCHEMA.md Course';

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
  if (select auth.uid()) is null then
    return new;
  end if;
  insert into public.course_instructors (course_id, user_id)
  values (new.id, (select auth.uid()))
  on conflict (course_id, user_id) do nothing;
  return new;
end;
$$;

create trigger courses_after_insert_instructor
after insert on public.courses
for each row execute function private.on_course_created();

-- ---------------------------------------------------------------------------
-- StudentProfile, Family, FamilyMember, ParentInvite, ParentStudentLink, Enrollment
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
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(name, ''))
  ) stored,
  constraint student_profiles_name_chk check (char_length(btrim(name)) > 0),
  constraint student_profiles_parent_email_lower_chk check (
    parent_email is null or parent_email = lower(parent_email)
  )
);

create index student_profiles_organization_id_idx on public.student_profiles (organization_id);
create index student_profiles_user_id_idx on public.student_profiles (user_id);
create index student_profiles_created_via_course_id_idx on public.student_profiles (created_via_course_id);
create index student_profiles_search_idx on public.student_profiles using gin (search_vector);

comment on table public.student_profiles is 'SCHEMA.md StudentProfile';

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
    new.parent_email := lower(new.parent_email);
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

create table public.parent_invites (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  email text not null,
  student_profile_id bigint not null references public.student_profiles (id) on delete cascade,
  invited_by uuid not null references public.profiles (id),
  token text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint parent_invites_email_lower_chk check (email = lower(email)),
  constraint parent_invites_token_key unique (token)
);

create index parent_invites_organization_id_idx on public.parent_invites (organization_id);
create index parent_invites_student_profile_id_idx on public.parent_invites (student_profile_id);
create index parent_invites_invited_by_idx on public.parent_invites (invited_by);
create unique index parent_invites_pending_uidx
  on public.parent_invites (organization_id, email, student_profile_id)
  where accepted_at is null;

comment on table public.parent_invites is 'SCHEMA.md ParentInvite';

create or replace function private.parent_invites_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.email := lower(new.email);
  return new;
end;
$$;

create trigger parent_invites_before_insert
before insert on public.parent_invites
for each row execute function private.parent_invites_before_insert();

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
  constraint materials_current_version_chk check (current_version >= 1)
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
create index materials_search_idx on public.materials using gin (search_vector);

comment on table public.materials is 'SCHEMA.md Material — page (blocks) | link | file; unit_id null = course/template top-level';

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
  parent_invite_id bigint references public.parent_invites (id) on delete cascade,
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
      and private.parent_can_view_course(m.course_id)
  );
$$;

grant usage on schema private to authenticated, service_role;

grant execute on all functions in schema private to authenticated, service_role;
