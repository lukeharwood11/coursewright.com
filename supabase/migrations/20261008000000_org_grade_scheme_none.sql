-- Org may disable age-level grade metadata (students + course catalog).

alter table public.organizations
  drop constraint organizations_grade_scheme_chk;

alter table public.organizations
  add constraint organizations_grade_scheme_chk
  check (grade_scheme in ('k12', 'custom', 'none'));

alter table public.organizations
  drop constraint organizations_grade_labels_chk;

alter table public.organizations
  add constraint organizations_grade_labels_chk
  check (
    (grade_scheme = 'none' and cardinality(grade_labels) = 0)
    or (grade_scheme <> 'none' and cardinality(grade_labels) >= 1)
  );

create or replace function private.organizations_apply_grade_scheme()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.slug is null or btrim(new.slug) = '' then
      new.slug := private.unique_org_slug(new.name);
    else
      new.slug := private.slugify(new.slug);
    end if;
  end if;

  if new.grade_scheme = 'k12'
    and (new.grade_labels is null or cardinality(new.grade_labels) = 0) then
    new.grade_labels := private.k12_grade_labels();
  elsif new.grade_scheme = 'none' then
    new.grade_labels := '{}'::text[];
  end if;

  if tg_op = 'UPDATE'
    and new.grade_scheme = 'none'
    and old.grade_scheme is distinct from 'none' then
    update public.student_profiles sp
    set grade_level = null
    where sp.organization_id = new.id
      and sp.grade_level is not null;

    update public.courses c
    set grade_levels = '{}'::text[]
    where c.organization_id = new.id
      and cardinality(c.grade_levels) > 0;

    update public.course_templates ct
    set grade_levels = '{}'::text[]
    where ct.organization_id = new.id
      and cardinality(ct.grade_levels) > 0;
  end if;

  return new;
end;
$$;

drop trigger if exists organizations_before_insert on public.organizations;

create trigger organizations_before_insert
before insert on public.organizations
for each row execute function private.organizations_apply_grade_scheme();

create trigger organizations_before_update_grade_scheme
before update of grade_scheme, grade_labels on public.organizations
for each row execute function private.organizations_apply_grade_scheme();

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
        and o.grade_scheme <> 'none'
        and new.grade_level = any (o.grade_labels)
    ) then
      raise exception 'grade_level must match the organization grade scheme';
    end if;
  end if;
  return new;
end;
$$;
