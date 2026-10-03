-- Resource links are materials on one Resources unit per course.
begin;
select plan(7);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'aaaa1111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'resource-staff@example.com',
  extensions.crypt('pass', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Resource Staff"}'::jsonb,
  now(), now()
);

insert into organizations (name, org_type, grade_scheme)
values
  ('Resource Co-op', 'coop', 'k12'),
  ('Other Co-op', 'coop', 'k12');

insert into courses (organization_id, title, status, visibility)
select id, 'Science', 'active', 'published'
from organizations
where name = 'Resource Co-op';

insert into org_resource_folders (
  organization_id, name, acl_inherit, created_by
)
select id, 'Handouts', false, 'aaaa1111-1111-1111-1111-111111111111'
from organizations
where name = 'Resource Co-op';

insert into org_resource_folders (
  organization_id, name, acl_inherit, created_by, archived_at
)
select id, 'Old handouts', false, 'aaaa1111-1111-1111-1111-111111111111', now()
from organizations
where name = 'Resource Co-op';

insert into org_resource_folders (
  organization_id, name, acl_inherit, created_by
)
select id, 'Extra', false, 'aaaa1111-1111-1111-1111-111111111111'
from organizations
where name = 'Resource Co-op';

insert into org_resource_folders (
  organization_id, name, acl_inherit, created_by
)
select id, 'Theirs', false, 'aaaa1111-1111-1111-1111-111111111111'
from organizations
where name = 'Other Co-op';

insert into org_resource_items (
  organization_id, type, title, visibility, acl_inherit, created_by
)
select id, 'document', 'Lab notes', 'unpublished', false, 'aaaa1111-1111-1111-1111-111111111111'
from organizations
where name = 'Resource Co-op';

select results_eq(
  $$
    select u.title, u.start_date is null, u.end_date is null
    from public.units u
    join public.courses c on c.id = u.course_id
    where c.title = 'Science'
      and u.is_resources
      and u.deleted_at is null
    order by u.id
  $$,
  $$values ('Resources'::text, true, true)$$,
  'new course gets one undated is_resources unit titled Resources'
);

select lives_ok(
  $$
    insert into public.materials (
      organization_id, course_id, unit_id, title, description, kind, work_type,
      resource_folder_id, position
    )
    select c.organization_id, c.id, u.id, 'Handouts link', '', 'resource', 'material',
      f.id, 0
    from public.courses c
    join public.units u on u.course_id = c.id and u.is_resources and u.deleted_at is null
    join public.org_resource_folders f on f.name = 'Handouts'
    where c.title = 'Science'
  $$,
  'inserting a resource material for a live same-org folder works'
);

select throws_ok(
  $$
    insert into public.materials (
      organization_id, course_id, unit_id, title, description, kind, work_type,
      resource_folder_id, position
    )
    select c.organization_id, c.id, u.id, 'Archived link', '', 'resource', 'material',
      f.id, 1
    from public.courses c
    join public.units u on u.course_id = c.id and u.is_resources and u.deleted_at is null
    join public.org_resource_folders f on f.name = 'Old handouts'
    where c.title = 'Science'
  $$,
  '23514',
  'That folder isn’t available.',
  'archived folder is rejected'
);

select throws_ok(
  $$
    insert into public.materials (
      organization_id, course_id, unit_id, title, description, kind, work_type,
      resource_folder_id, position
    )
    select c.organization_id, c.id, u.id, 'Other org link', '', 'resource', 'material',
      f.id, 1
    from public.courses c
    join public.units u on u.course_id = c.id and u.is_resources and u.deleted_at is null
    join public.org_resource_folders f on f.name = 'Theirs'
    where c.title = 'Science'
  $$,
  '23514',
  'Resource must belong to the same organization as the course.',
  'other-org target is rejected'
);

select throws_ok(
  $$
    insert into public.materials (
      organization_id, course_id, unit_id, title, description, kind, work_type,
      resource_folder_id, resource_item_id, position
    )
    select c.organization_id, c.id, u.id, 'Both targets', '', 'resource', 'material',
      f.id, i.id, 1
    from public.courses c
    join public.units u on u.course_id = c.id and u.is_resources and u.deleted_at is null
    join public.org_resource_folders f on f.name = 'Extra'
    join public.org_resource_items i on i.title = 'Lab notes'
    where c.title = 'Science'
  $$,
  '23514',
  'new row for relation "materials" violates check constraint "materials_resource_target_chk"',
  'kind resource cannot set both targets'
);

select lives_ok(
  $$
    insert into public.materials (
      organization_id, course_id, unit_id, title, description, kind, work_type,
      resource_item_id, position
    )
    select c.organization_id, c.id, u.id, 'Notes link', '', 'resource', 'material',
      i.id, 1
    from public.courses c
    join public.units u on u.course_id = c.id and u.is_resources and u.deleted_at is null
    join public.org_resource_items i on i.title = 'Lab notes'
    where c.title = 'Science'
  $$,
  'inserting a resource material for a live same-org item works'
);

update public.materials
set visibility = 'published'
where title = 'Notes link';

select is(
  (select visibility from public.org_resource_items where title = 'Lab notes'),
  'unpublished',
  'publishing the material row does not change the item visibility'
);

select * from finish();
rollback;
