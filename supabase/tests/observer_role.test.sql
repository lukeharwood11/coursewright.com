-- Observer browses like staff and cannot write. Writers stay writers.
begin;
select plan(16);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111176',
    'authenticated', 'authenticated', 'observer-owner@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Observer Owner"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222276',
    'authenticated', 'authenticated', 'observer-teacher@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Observer Teacher"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333376',
    'authenticated', 'authenticated', 'observer-reader@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Observer Reader"}'::jsonb,
    now(), now()
  );

insert into organizations (name, org_type, grade_scheme)
values ('Observer Co-op', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, '11111111-1111-1111-1111-111111111176', 'owner', 'active'
from organizations where name = 'Observer Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, '22222222-2222-2222-2222-222222222276', 'instructor', 'active'
from organizations where name = 'Observer Co-op';

insert into memberships (organization_id, user_id, role, status, is_parent)
select id, '33333333-3333-3333-3333-333333333376', 'observer', 'active', true
from organizations where name = 'Observer Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Observer Draft', 'active', 'unpublished'
from organizations where name = 'Observer Co-op';

insert into course_instructors (course_id, user_id)
select c.id, '22222222-2222-2222-2222-222222222276'
from courses c
where c.title = 'Observer Draft';

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333376', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-3333-3333-333333333376","role":"authenticated"}',
  true
);

select is(
  (select private.is_org_staff(id) from organizations where name = 'Observer Co-op'),
  false,
  'observer is not is_org_staff'
);

select is(
  (select private.can_browse_as_staff(id) from organizations where name = 'Observer Co-op'),
  true,
  'observer can_browse_as_staff'
);

select is(
  (select private.is_org_admin(id) from organizations where name = 'Observer Co-op'),
  false,
  'observer is not is_org_admin'
);

select is(
  (select private.can_browse_like_admin(id) from organizations where name = 'Observer Co-op'),
  true,
  'observer can_browse_like_admin'
);

select is(
  (select private.can_browse_course(id) from courses where title = 'Observer Draft'),
  true,
  'observer can_browse_course including drafts'
);

set local role authenticated;

select results_eq(
  $$select title from courses where title = 'Observer Draft'$$,
  array['Observer Draft'::text],
  'observer can select an unpublished course'
);

select throws_ok(
  $$update courses set title = 'Observer Hack' where title = 'Observer Draft'$$,
  '42501',
  null,
  'observer cannot update a course'
);

select throws_ok(
  $$insert into courses (organization_id, title, status, visibility)
    select id, 'Observer Insert', 'active', 'unpublished'
    from organizations where name = 'Observer Co-op'$$,
  '42501',
  null,
  'observer cannot insert a course'
);

select throws_ok(
  $$delete from courses where title = 'Observer Draft'$$,
  '42501',
  null,
  'observer cannot delete a course'
);

select throws_ok(
  $$insert into admin_invites (organization_id, email, role, invited_by)
    select id, 'someone@example.com', 'instructor', '33333333-3333-3333-3333-333333333376'
    from organizations where name = 'Observer Co-op'$$,
  '42501',
  null,
  'observer cannot invite'
);

reset role;

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222276', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222276","role":"authenticated"}',
  true
);

select is(
  (select private.is_org_staff(id) from organizations where name = 'Observer Co-op'),
  true,
  'instructor is still is_org_staff'
);

select is(
  (select private.can_browse_as_staff(id) from organizations where name = 'Observer Co-op'),
  true,
  'instructor can_browse_as_staff'
);

set local role authenticated;

select lives_ok(
  $$update courses set description = 'still taught' where title = 'Observer Draft'$$,
  'instructor can still update a course they teach'
);

reset role;

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111176', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111176","role":"authenticated"}',
  true
);

select is(
  (select private.is_org_admin(id) from organizations where name = 'Observer Co-op'),
  true,
  'owner is still is_org_admin'
);

set local role authenticated;

select lives_ok(
  $$insert into admin_invites (organization_id, email, role, invited_by)
    select id, 'new-observer@example.com', 'observer', '11111111-1111-1111-1111-111111111176'
    from organizations where name = 'Observer Co-op'$$,
  'owner can invite an observer'
);

select is(
  (select student_profile_id is null
     from admin_invites
    where email = 'new-observer@example.com'),
  true,
  'observer invite has no student profile'
);

reset role;

select throws_ok(
  $$update memberships
      set role = 'observer'
    where user_id = '11111111-1111-1111-1111-111111111176'$$,
  'P0001',
  'cannot remove or demote the last remaining owner or admin',
  'an observer does not count as the last manager'
);

select * from finish();
rollback;
