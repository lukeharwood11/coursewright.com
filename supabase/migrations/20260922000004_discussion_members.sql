-- Who can currently see a discussion (staff + qualifying parents).
-- Security definer so parents can read the full access list without
-- memberships_select / parent_student_links_select of other people.

create or replace function public.list_discussion_members(p_discussion_id bigint)
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
begin
  if p_discussion_id is null then
    raise exception 'That discussion couldn’t be found.';
  end if;

  if not private.can_see_discussion(p_discussion_id) then
    raise exception 'You can’t see this discussion.';
  end if;

  return query
  with d as (
    select
      disc.organization_id,
      disc.audience,
      disc.course_id,
      disc.class_id
    from public.discussions disc
    where disc.id = p_discussion_id
  ),
  staff as (
    select
      m.user_id,
      coalesce(nullif(trim(p.name), ''), p.email, 'Someone') as display_name,
      m.role
    from d
    join public.memberships m
      on m.organization_id = d.organization_id
     and m.status = 'active'
     and m.role in ('owner', 'admin', 'instructor')
    join public.profiles p on p.id = m.user_id
  ),
  parents as (
    select distinct
      m.user_id,
      coalesce(nullif(trim(p.name), ''), p.email, 'Someone') as display_name,
      m.role
    from d
    join public.memberships m
      on m.organization_id = d.organization_id
     and m.status = 'active'
     and m.role = 'parent'
    join public.profiles p on p.id = m.user_id
    where
      (
        d.audience = 'course'
        and exists (
          select 1
          from public.courses c
          join public.enrollments e
            on e.course_id = c.id
           and e.status = 'active'
          join public.parent_student_links psl
            on psl.student_profile_id = e.student_profile_id
           and psl.parent_user_id = m.user_id
          where c.id = d.course_id
            and c.status = 'active'
            and c.visibility = 'published'
        )
      )
      or (
        d.audience = 'class'
        and exists (
          select 1
          from public.class_members cm
          join public.parent_student_links psl
            on psl.student_profile_id = cm.student_profile_id
           and psl.parent_user_id = m.user_id
          where cm.class_id = d.class_id
        )
      )
  )
  select s.user_id, s.display_name, s.role
  from (
    select * from staff
    union
    select * from parents
  ) s
  order by lower(s.display_name), s.role;
end;
$$;

revoke all on function public.list_discussion_members(bigint) from public;
grant execute on function public.list_discussion_members(bigint)
  to authenticated, service_role;

comment on function public.list_discussion_members(bigint) is
  'People who can currently see a discussion: org staff plus parents linked to the audience course or class.';
