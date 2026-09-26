-- Organization discussions have no course_id / class_id; skip org check.

create or replace function private.discussion_target_in_org()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_org bigint;
begin
  if new.audience = 'organization' then
    return new;
  end if;

  if new.audience = 'course' then
    select c.organization_id into target_org
    from public.courses c
    where c.id = new.course_id;
  elsif new.audience = 'class' then
    select c.organization_id into target_org
    from public.classes c
    where c.id = new.class_id
      and c.deleted_at is null;
  else
    return new;
  end if;

  if target_org is null or target_org is distinct from new.organization_id then
    raise exception 'That course or class needs to be in this organization.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

-- RPC passes 0 for unused course/class ids; organization audience requires both unset.
create or replace function private.can_start_discussion(
  p_org_id bigint,
  p_audience text,
  p_course_id bigint,
  p_class_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    not exists (
      select 1
      from public.memberships m
      where m.organization_id = p_org_id
        and m.user_id = (select auth.uid())
        and m.role = 'observer'
        and m.status = 'active'
    )
    and case p_audience
      when 'course' then
        nullif(p_course_id, 0) is not null
        and exists (
          select 1
          from public.courses c
          where c.id = nullif(p_course_id, 0)
            and c.organization_id = p_org_id
        )
        and (
          private.can_manage_course(nullif(p_course_id, 0))
          or private.parent_can_view_course(nullif(p_course_id, 0))
          or private.student_can_view_course(nullif(p_course_id, 0))
        )
      when 'class' then
        nullif(p_class_id, 0) is not null
        and exists (
          select 1
          from public.classes c
          where c.id = nullif(p_class_id, 0)
            and c.organization_id = p_org_id
            and c.deleted_at is null
        )
        and (
          private.is_org_staff(p_org_id)
          or private.parent_linked_to_class(nullif(p_class_id, 0))
          or private.student_linked_to_class(nullif(p_class_id, 0))
        )
      when 'organization' then
        nullif(p_course_id, 0) is null
        and nullif(p_class_id, 0) is null
        and (select private.is_org_staff(p_org_id))
      else false
    end;
$$;

drop function if exists public.list_discussion_audience_members(bigint, text, bigint, bigint);

create or replace function public.list_discussion_audience_members(
  p_organization_id bigint,
  p_audience text,
  p_course_id bigint,
  p_class_id bigint,
  p_family_audience text default 'both'
)
returns table (
  user_id uuid,
  name text,
  role text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_course_id bigint := nullif(p_course_id, 0);
  v_class_id bigint := nullif(p_class_id, 0);
begin
  if not private.can_start_discussion(
    p_organization_id,
    p_audience,
    v_course_id,
    v_class_id
  ) then
    raise exception 'You can’t start a discussion for that audience.';
  end if;

  return query
  select people.user_id, people.name, people.role
  from private.discussion_audience_people(
    p_organization_id,
    p_audience,
    v_course_id,
    v_class_id,
    p_family_audience
  ) as people;
end;
$$;

grant execute on function public.list_discussion_audience_members(
  bigint, text, bigint, bigint, text
) to authenticated, service_role;
