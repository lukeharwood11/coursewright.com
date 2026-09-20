-- RLS, grants, and Storage for docs/database/SCHEMA.md P0 access model.
-- Parent SELECT of course content: parent membership + ParentStudentLink +
-- Enrollment.status = active + Course.status = active + Course.visibility = published.
-- App entity IDs are bigint; profiles remain uuid.

-- ---------------------------------------------------------------------------
-- Family SECURITY DEFINER helpers (avoid families ↔ family_members RLS recursion)
-- ---------------------------------------------------------------------------

create or replace function private.is_family_parent(p_family_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = p_family_id
      and fm.parent_user_id = (select auth.uid())
  );
$$;

create or replace function private.family_organization_id(p_family_id bigint)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select f.organization_id
  from public.families f
  where f.id = p_family_id;
$$;

grant execute on function private.is_family_parent(bigint) to authenticated, service_role;
grant execute on function private.family_organization_id(bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Grants: no anon access (P0 requires login). Authenticated + RLS.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles',
    'organizations',
    'memberships',
    'admin_invites',
    'admin_invite_students',
    'course_templates',
    'template_access',
    'courses',
    'course_instructors',
    'student_profiles',
    'families',
    'family_members',
    'parent_student_links',
    'enrollments',
    'classes',
    'class_members',
    'files',
    'file_versions',
    'units',
    'materials',
    'blocks',
    'material_versions',
    'share_links',
    'important_now',
    'lesson_plans',
    'lesson_plan_days',
    'lesson_plan_day_materials',
    'announcements',
    'announcement_reads'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.organizations to authenticated;
grant select, insert, update, delete on table public.memberships to authenticated;
grant select, insert, delete on table public.admin_invites to authenticated;
grant select, insert, delete on table public.admin_invite_students to authenticated;
grant select, insert, update on table public.course_templates to authenticated;
grant select, insert, update, delete on table public.template_access to authenticated;
grant select, insert, update on table public.courses to authenticated;
grant select, insert, delete on table public.course_instructors to authenticated;
grant select, insert, update on table public.student_profiles to authenticated;
grant select, insert, update on table public.families to authenticated;
grant select, insert, update, delete on table public.family_members to authenticated;
grant select, insert, delete on table public.parent_student_links to authenticated;
grant select, insert, update on table public.enrollments to authenticated;
grant select, insert, update on table public.classes to authenticated;
grant select, insert, update, delete on table public.class_members to authenticated;
grant select, insert, update on table public.files to authenticated;
grant select on table public.file_versions to authenticated;
grant select, insert, update on table public.units to authenticated;
grant select, insert, update on table public.materials to authenticated;
grant select, insert, update on table public.blocks to authenticated;
grant select on table public.material_versions to authenticated;
grant select, insert, update, delete on table public.share_links to authenticated;
grant select, insert, delete on table public.important_now to authenticated;
grant select, insert, update on table public.lesson_plans to authenticated;
grant select, insert, update, delete on table public.lesson_plan_days to authenticated;
grant select, insert, update, delete on table public.lesson_plan_day_materials to authenticated;
grant select, insert, update on table public.announcements to authenticated;
grant select, insert on table public.announcement_reads to authenticated;

grant usage, select on all sequences in schema public to authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to service_role;

-- ---------------------------------------------------------------------------
-- profiles (SCHEMA.md User)
-- ---------------------------------------------------------------------------

create policy profiles_select on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or (select private.shares_org_with(id))
);

create policy profiles_insert on public.profiles
for insert to authenticated
with check (id = (select auth.uid()));

create policy profiles_update on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

create policy organizations_select on public.organizations
for select to authenticated
using ((select private.is_org_member(id)));

create policy organizations_select_pending_invite
  on public.organizations
  for select
  to authenticated
  using ((select private.has_pending_invite_for_me(id)));

create policy organizations_insert on public.organizations
for insert to authenticated
with check ((select auth.uid()) is not null);

create policy organizations_update on public.organizations
for update to authenticated
using ((select private.is_org_admin(id)))
with check ((select private.is_org_admin(id)));

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------

create policy memberships_select on public.memberships
for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_org_staff(organization_id))
);

-- Owner membership is created by the org-created trigger (security definer).
create policy memberships_insert on public.memberships
for insert to authenticated
with check (
  (select private.is_org_admin(organization_id))
  and role in ('admin', 'instructor')
);

create policy memberships_update on public.memberships
for update to authenticated
using ((select private.is_org_admin(organization_id)))
with check ((select private.is_org_admin(organization_id)));

create policy memberships_delete on public.memberships
for delete to authenticated
using (
  (select private.is_org_admin(organization_id))
  and role in ('admin', 'instructor')
);

-- ---------------------------------------------------------------------------
-- admin_invites
-- ---------------------------------------------------------------------------

create policy admin_invites_select on public.admin_invites
  for select
  to authenticated
  using (
    (
      accepted_at is null
      and email = (select private.current_profile_email())
    )
    or (
      role in ('owner', 'admin', 'instructor')
      and (select private.is_org_admin(organization_id))
    )
    or (
      role = 'parent'
      and (select private.is_org_staff(organization_id))
    )
  );

create policy admin_invites_insert on public.admin_invites
  for insert
  to authenticated
  with check (
    invited_by = (select auth.uid())
    and (
      (
        role in ('owner', 'admin', 'instructor')
        and (select private.is_org_admin(organization_id))
      )
      or (
        role = 'parent'
        and (select private.is_org_staff(organization_id))
      )
    )
  );

create policy admin_invites_delete on public.admin_invites
  for delete
  to authenticated
  using (
    accepted_at is null
    and (
      (
        role in ('owner', 'admin', 'instructor')
        and (select private.is_org_admin(organization_id))
      )
      or (
        role = 'parent'
        and (select private.is_org_staff(organization_id))
      )
    )
  );

-- ---------------------------------------------------------------------------
-- admin_invite_students
-- ---------------------------------------------------------------------------

create policy admin_invite_students_select on public.admin_invite_students
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_invites i
      where i.id = invite_id
        and (
          (
            i.accepted_at is null
            and i.email = (select private.current_profile_email())
          )
          or (
            i.role = 'parent'
            and (select private.is_org_staff(i.organization_id))
          )
        )
    )
  );

create policy admin_invite_students_insert on public.admin_invite_students
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_invites i
      where i.id = invite_id
        and i.role = 'parent'
        and i.accepted_at is null
        and (select private.is_org_staff(i.organization_id))
    )
  );

create policy admin_invite_students_delete on public.admin_invite_students
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_invites i
      where i.id = invite_id
        and i.role = 'parent'
        and i.accepted_at is null
        and (select private.is_org_staff(i.organization_id))
    )
  );

-- ---------------------------------------------------------------------------
-- course_templates / template_access
-- ---------------------------------------------------------------------------

create policy course_templates_select on public.course_templates
for select to authenticated
using ((select private.can_view_template(id)));

create policy course_templates_insert on public.course_templates
for insert to authenticated
with check (
  (select private.is_org_staff(organization_id))
  and created_by = (select auth.uid())
);

create policy course_templates_update on public.course_templates
for update to authenticated
using ((select private.can_edit_template(id)))
with check ((select private.can_edit_template(id)));

create policy template_access_select on public.template_access
for select to authenticated
using ((select private.can_view_template(template_id)));

create policy template_access_insert on public.template_access
for insert to authenticated
with check (
  (select private.can_edit_template(template_id))
  and (
    (select private.is_org_admin((
      select t.organization_id from public.course_templates t where t.id = template_id
    )))
    or (select private.template_permission(template_id)) = 'owner'
  )
);

create policy template_access_update on public.template_access
for update to authenticated
using (
  (select private.template_permission(template_id)) = 'owner'
  or (select private.is_org_admin((
    select t.organization_id from public.course_templates t where t.id = template_id
  )))
)
with check (
  (select private.template_permission(template_id)) = 'owner'
  or (select private.is_org_admin((
    select t.organization_id from public.course_templates t where t.id = template_id
  )))
);

create policy template_access_delete on public.template_access
for delete to authenticated
using (
  (select private.template_permission(template_id)) = 'owner'
  or (select private.is_org_admin((
    select t.organization_id from public.course_templates t where t.id = template_id
  )))
);

-- ---------------------------------------------------------------------------
-- courses / course_instructors
-- ---------------------------------------------------------------------------

create policy courses_select on public.courses
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (select private.parent_can_view_course(id))
);

create policy courses_insert on public.courses
for insert to authenticated
with check ((select private.is_org_staff(organization_id)));

create policy courses_update on public.courses
for update to authenticated
using ((select private.can_manage_course(id)))
with check ((select private.can_manage_course(id)));

create policy course_instructors_select on public.course_instructors
for select to authenticated
using (
  (select private.is_org_staff((
    select c.organization_id from public.courses c where c.id = course_id
  )))
  or (select private.parent_can_view_course(course_id))
);

create policy course_instructors_insert on public.course_instructors
for insert to authenticated
with check ((select private.is_org_admin((
  select c.organization_id from public.courses c where c.id = course_id
))));

create policy course_instructors_delete on public.course_instructors
for delete to authenticated
using ((select private.is_org_admin((
  select c.organization_id from public.courses c where c.id = course_id
))));

-- ---------------------------------------------------------------------------
-- Roster
-- ---------------------------------------------------------------------------

create policy student_profiles_select on public.student_profiles
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (select private.parent_linked_to_student(id))
);

create policy student_profiles_insert on public.student_profiles
for insert to authenticated
with check ((select private.is_org_staff(organization_id)));

create policy student_profiles_update on public.student_profiles
for update to authenticated
using ((select private.is_org_staff(organization_id)))
with check ((select private.is_org_staff(organization_id)));

create policy families_select on public.families
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (select private.is_family_parent(id))
);

create policy families_insert on public.families
for insert to authenticated
with check ((select private.is_org_staff(organization_id)));

create policy families_update on public.families
for update to authenticated
using ((select private.is_org_staff(organization_id)))
with check ((select private.is_org_staff(organization_id)));

create policy family_members_select on public.family_members
for select to authenticated
using (
  (select private.is_org_staff((select private.family_organization_id(family_id))))
  or parent_user_id = (select auth.uid())
  or (select private.parent_linked_to_student(student_profile_id))
);

create policy family_members_insert on public.family_members
for insert to authenticated
with check ((select private.is_org_staff((
  select private.family_organization_id(family_id)
))));

create policy family_members_update on public.family_members
for update to authenticated
using ((select private.is_org_staff((
  select private.family_organization_id(family_id)
))))
with check ((select private.is_org_staff((
  select private.family_organization_id(family_id)
))));

create policy family_members_delete on public.family_members
for delete to authenticated
using ((select private.is_org_staff((
  select private.family_organization_id(family_id)
))));

create policy parent_student_links_select on public.parent_student_links
for select to authenticated
using (
  parent_user_id = (select auth.uid())
  or (select private.is_org_staff((
    select sp.organization_id from public.student_profiles sp
    where sp.id = student_profile_id
  )))
);

create policy parent_student_links_insert on public.parent_student_links
for insert to authenticated
with check ((select private.is_org_staff((
  select sp.organization_id from public.student_profiles sp
  where sp.id = student_profile_id
))));

create policy parent_student_links_delete on public.parent_student_links
for delete to authenticated
using ((select private.is_org_staff((
  select sp.organization_id from public.student_profiles sp
  where sp.id = student_profile_id
))));

create policy enrollments_select on public.enrollments
for select to authenticated
using (
  (select private.is_org_staff((
    select c.organization_id from public.courses c where c.id = course_id
  )))
  or (select private.parent_linked_to_student(student_profile_id))
);

create policy enrollments_insert on public.enrollments
for insert to authenticated
with check ((select private.is_org_staff((
  select c.organization_id from public.courses c where c.id = course_id
))));

create policy enrollments_update on public.enrollments
for update to authenticated
using ((select private.is_org_staff((
  select c.organization_id from public.courses c where c.id = course_id
))))
with check ((select private.is_org_staff((
  select c.organization_id from public.courses c where c.id = course_id
))));

-- ---------------------------------------------------------------------------
-- Classes / class_members (staff only — parents have no class CRUD)
-- ---------------------------------------------------------------------------

create policy classes_select on public.classes
for select to authenticated
using ((select private.is_org_staff(organization_id)));

create policy classes_insert on public.classes
for insert to authenticated
with check ((select private.is_org_staff(organization_id)));

create policy classes_update on public.classes
for update to authenticated
using ((select private.is_org_staff(organization_id)))
with check ((select private.is_org_staff(organization_id)));

create policy class_members_select on public.class_members
for select to authenticated
using ((select private.is_org_staff((
  select c.organization_id from public.classes c where c.id = class_id
))));

create policy class_members_insert on public.class_members
for insert to authenticated
with check ((select private.is_org_staff((
  select c.organization_id from public.classes c where c.id = class_id
))));

create policy class_members_update on public.class_members
for update to authenticated
using ((select private.is_org_staff((
  select c.organization_id from public.classes c where c.id = class_id
))))
with check ((select private.is_org_staff((
  select c.organization_id from public.classes c where c.id = class_id
))));

create policy class_members_delete on public.class_members
for delete to authenticated
using ((select private.is_org_staff((
  select c.organization_id from public.classes c where c.id = class_id
))));

-- ---------------------------------------------------------------------------
-- Files / versions
-- ---------------------------------------------------------------------------

create policy files_select on public.files
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (select private.parent_can_view_file(id))
);

create policy files_insert on public.files
for insert to authenticated
with check (
  (select private.is_org_staff(organization_id))
  and uploaded_by = (select auth.uid())
);

create policy files_update on public.files
for update to authenticated
using ((select private.is_org_staff(organization_id)))
with check ((select private.is_org_staff(organization_id)));

create policy file_versions_select on public.file_versions
for select to authenticated
using (
  exists (
    select 1
    from public.files f
    where f.id = file_id
      and (
        (select private.is_org_staff(f.organization_id))
        or (select private.parent_can_view_file(f.id))
      )
  )
);

-- ---------------------------------------------------------------------------
-- Units / materials / blocks / material_versions
-- ---------------------------------------------------------------------------

create policy units_select on public.units
for select to authenticated
using (
  (course_id is not null and (
    (select private.is_org_staff(organization_id))
    or (
      deleted_at is null
      and (select private.parent_can_view_course(course_id))
    )
  ))
  or (template_id is not null and (select private.can_view_template(template_id)))
);

create policy units_insert on public.units
for insert to authenticated
with check (
  (course_id is not null and (select private.can_manage_course(course_id)))
  or (template_id is not null and (select private.can_edit_template(template_id)))
);

create policy units_update on public.units
for update to authenticated
using (
  (course_id is not null and (select private.can_manage_course(course_id)))
  or (template_id is not null and (select private.can_edit_template(template_id)))
)
with check (
  (course_id is not null and (select private.can_manage_course(course_id)))
  or (template_id is not null and (select private.can_edit_template(template_id)))
);

create policy materials_select on public.materials
for select to authenticated
using (
  (course_id is not null and (
    (select private.is_org_staff(organization_id))
    or (select private.parent_can_view_material(id))
  ))
  or (template_id is not null and (select private.can_view_template(template_id)))
);

create policy materials_insert on public.materials
for insert to authenticated
with check (
  (course_id is not null and (select private.can_manage_course(course_id)))
  or (template_id is not null and (select private.can_edit_template(template_id)))
);

create policy materials_update on public.materials
for update to authenticated
using (
  (course_id is not null and (select private.can_manage_course(course_id)))
  or (template_id is not null and (select private.can_edit_template(template_id)))
)
with check (
  (course_id is not null and (select private.can_manage_course(course_id)))
  or (template_id is not null and (select private.can_edit_template(template_id)))
);

-- Select if the parent material is selectable; mutate via course/template manage rights.
create policy blocks_select on public.blocks
for select to authenticated
using (
  exists (
    select 1
    from public.materials m
    where m.id = material_id
      and (
        (m.course_id is not null and (
          (select private.is_org_staff(m.organization_id))
          or (select private.parent_can_view_material(m.id))
        ))
        or (m.template_id is not null and (select private.can_view_template(m.template_id)))
      )
  )
);

create policy blocks_insert on public.blocks
for insert to authenticated
with check (
  exists (
    select 1
    from public.materials m
    where m.id = material_id
      and (
        (m.course_id is not null and (select private.can_manage_course(m.course_id)))
        or (m.template_id is not null and (select private.can_edit_template(m.template_id)))
      )
  )
);

create policy blocks_update on public.blocks
for update to authenticated
using (
  exists (
    select 1
    from public.materials m
    where m.id = material_id
      and (
        (m.course_id is not null and (select private.can_manage_course(m.course_id)))
        or (m.template_id is not null and (select private.can_edit_template(m.template_id)))
      )
  )
)
with check (
  exists (
    select 1
    from public.materials m
    where m.id = material_id
      and (
        (m.course_id is not null and (select private.can_manage_course(m.course_id)))
        or (m.template_id is not null and (select private.can_edit_template(m.template_id)))
      )
  )
);

create policy material_versions_select on public.material_versions
for select to authenticated
using (
  exists (
    select 1
    from public.materials m
    where m.id = material_id
      and (
        (m.course_id is not null and (
          (select private.is_org_staff(m.organization_id))
          or (select private.parent_can_view_material(m.id))
        ))
        or (m.template_id is not null and (select private.can_view_template(m.template_id)))
      )
  )
);

-- ---------------------------------------------------------------------------
-- share_links / important_now
-- ---------------------------------------------------------------------------

create policy share_links_select on public.share_links
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (
    course_id is not null
    and (select private.parent_can_view_course(course_id))
  )
);

create policy share_links_insert on public.share_links
for insert to authenticated
with check ((select private.is_org_staff(organization_id)));

create policy share_links_update on public.share_links
for update to authenticated
using ((select private.is_org_staff(organization_id)))
with check ((select private.is_org_staff(organization_id)));

create policy share_links_delete on public.share_links
for delete to authenticated
using ((select private.is_org_staff(organization_id)));

create policy important_now_select on public.important_now
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (select private.parent_can_view_material(material_id))
);

create policy important_now_insert on public.important_now
for insert to authenticated
with check (
  (select private.can_manage_course(course_id))
  and created_by = (select auth.uid())
);

create policy important_now_delete on public.important_now
for delete to authenticated
using ((select private.can_manage_course(course_id)));


-- ---------------------------------------------------------------------------
-- Classes: families may SELECT classes they are linked to (announcement attribution)
-- ---------------------------------------------------------------------------

create policy classes_parent_select on public.classes
for select to authenticated
using (
  deleted_at is null
  and (select private.parent_linked_to_class(id))
);

create policy class_members_parent_select on public.class_members
for select to authenticated
using ((select private.parent_linked_to_student(student_profile_id)));

-- ---------------------------------------------------------------------------
-- Lesson plans
-- ---------------------------------------------------------------------------

create policy lesson_plans_select on public.lesson_plans
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (
    deleted_at is null
    and visibility = 'published'
    and (select private.parent_can_view_course(course_id))
  )
);

create policy lesson_plans_insert on public.lesson_plans
for insert to authenticated
with check (
  (select private.can_manage_course(course_id))
  and created_by = (select auth.uid())
);

create policy lesson_plans_update on public.lesson_plans
for update to authenticated
using ((select private.can_manage_course(course_id)))
with check ((select private.can_manage_course(course_id)));

create policy lesson_plan_days_select on public.lesson_plan_days
for select to authenticated
using (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and (
        (select private.is_org_staff(lp.organization_id))
        or (
          lp.deleted_at is null
          and lp.visibility = 'published'
          and (select private.parent_can_view_course(lp.course_id))
        )
      )
  )
);

create policy lesson_plan_days_insert on public.lesson_plan_days
for insert to authenticated
with check (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and lp.deleted_at is null
      and (select private.can_manage_course(lp.course_id))
  )
);

create policy lesson_plan_days_update on public.lesson_plan_days
for update to authenticated
using (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and (select private.can_manage_course(lp.course_id))
  )
)
with check (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and (select private.can_manage_course(lp.course_id))
  )
);

create policy lesson_plan_days_delete on public.lesson_plan_days
for delete to authenticated
using (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and (select private.can_manage_course(lp.course_id))
  )
);

create policy lesson_plan_day_materials_select on public.lesson_plan_day_materials
for select to authenticated
using (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and (
        (select private.is_org_staff(lp.organization_id))
        or (
          lp.deleted_at is null
          and lp.visibility = 'published'
          and (select private.parent_can_view_course(lp.course_id))
        )
      )
  )
);

create policy lesson_plan_day_materials_insert on public.lesson_plan_day_materials
for insert to authenticated
with check (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and lp.deleted_at is null
      and (select private.can_manage_course(lp.course_id))
  )
);

create policy lesson_plan_day_materials_update on public.lesson_plan_day_materials
for update to authenticated
using (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and (select private.can_manage_course(lp.course_id))
  )
)
with check (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and (select private.can_manage_course(lp.course_id))
  )
);

create policy lesson_plan_day_materials_delete on public.lesson_plan_day_materials
for delete to authenticated
using (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and (select private.can_manage_course(lp.course_id))
  )
);

-- ---------------------------------------------------------------------------
-- Announcements
-- ---------------------------------------------------------------------------

create policy announcements_select on public.announcements
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (
    deleted_at is null
    and (select private.parent_can_view_announcement(id))
  )
);

create policy announcements_insert on public.announcements
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_post_announcement(
    organization_id,
    audience,
    course_ids,
    class_ids,
    student_profile_ids
  ))
);

create policy announcements_update on public.announcements
for update to authenticated
using (
  (select private.can_post_announcement(
    organization_id,
    audience,
    course_ids,
    class_ids,
    student_profile_ids
  ))
)
with check (
  (select private.can_post_announcement(
    organization_id,
    audience,
    course_ids,
    class_ids,
    student_profile_ids
  ))
);

create policy announcement_reads_select on public.announcement_reads
for select to authenticated
using (user_id = (select auth.uid()));

create policy announcement_reads_insert on public.announcement_reads
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.announcements a
    where a.id = announcement_id
      and a.deleted_at is null
      and (
        (select private.is_org_staff(a.organization_id))
        or (select private.parent_can_view_announcement(a.id))
      )
  )
);

-- ---------------------------------------------------------------------------
-- Storage: org-files / {organization_id}/{file_id}/{version_id}/filename
-- Path segments are bigint (organization_id, file_id).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('org-files', 'org-files', false, 536870912)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

create policy org_files_select on storage.objects
for select to authenticated
using (
  bucket_id = 'org-files'
  and (
    (select private.is_org_staff((string_to_array(name, '/'))[1]::bigint))
    or (select private.parent_can_view_file((string_to_array(name, '/'))[2]::bigint))
  )
);

create policy org_files_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'org-files'
  and (select private.is_org_staff((string_to_array(name, '/'))[1]::bigint))
);

create policy org_files_update on storage.objects
for update to authenticated
using (
  bucket_id = 'org-files'
  and (select private.is_org_staff((string_to_array(name, '/'))[1]::bigint))
)
with check (
  bucket_id = 'org-files'
  and (select private.is_org_staff((string_to_array(name, '/'))[1]::bigint))
);

create policy org_files_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'org-files'
  and (select private.is_org_staff((string_to_array(name, '/'))[1]::bigint))
);
