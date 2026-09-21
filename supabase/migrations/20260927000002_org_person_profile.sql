-- Org-visible user profiles: members can look up another person’s name, role,
-- courses they teach, classes they lead, and family course enrollments.

create or replace function public.get_org_person_profile(
  p_organization_id bigint,
  p_user_id uuid
)
returns table (
  user_id uuid,
  name text,
  role text,
  teaches jsonb,
  leads jsonb,
  courses jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_staff boolean;
begin
  if p_organization_id is null or p_user_id is null then
    raise exception 'That person couldn’t be found.';
  end if;

  if not private.is_org_member(p_organization_id) then
    raise exception 'You don’t have access to this organization.';
  end if;

  v_staff := private.is_org_staff(p_organization_id);

  return query
  select
    m.user_id,
    coalesce(nullif(trim(p.name), ''), p.email, 'Someone') as name,
    m.role,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'title', c.title) order by c.title)
      from public.course_instructors ci
      join public.courses c on c.id = ci.course_id
      where ci.user_id = m.user_id
        and c.organization_id = p_organization_id
        and c.status = 'active'
        and (v_staff or c.visibility = 'published')
    ), '[]'::jsonb) as teaches,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', cl.id, 'title', cl.title) order by cl.title)
      from public.class_leaders ldr
      join public.classes cl on cl.id = ldr.class_id
      where ldr.user_id = m.user_id
        and cl.organization_id = p_organization_id
        and cl.deleted_at is null
    ), '[]'::jsonb) as leads,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title) order by x.title)
      from (
        select distinct c.id, c.title
        from public.parent_student_links psl
        join public.enrollments e
          on e.student_profile_id = psl.student_profile_id
         and e.status = 'active'
        join public.courses c on c.id = e.course_id
        where psl.parent_user_id = m.user_id
          and c.organization_id = p_organization_id
          and c.status = 'active'
          and (v_staff or c.visibility = 'published')
      ) x
    ), '[]'::jsonb) as courses
  from public.memberships m
  join public.profiles p on p.id = m.user_id
  where m.organization_id = p_organization_id
    and m.user_id = p_user_id
    and m.status = 'active';
end;
$$;

revoke all on function public.get_org_person_profile(bigint, uuid) from public;
revoke all on function public.get_org_person_profile(bigint, uuid) from anon;
grant execute on function public.get_org_person_profile(bigint, uuid) to authenticated;

comment on function public.get_org_person_profile(bigint, uuid) is
  'Directory profile for one org member. Families see published courses only.';
