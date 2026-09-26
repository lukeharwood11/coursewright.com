-- Removed or suspended staff lose course edit access.
-- Parent and student flags survive exclusive role changes.
begin;
select plan(13);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaa1111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'access-owner@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Access Owner"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbb2222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated', 'access-teacher@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Access Teacher"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'cccc3333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated', 'access-suspended@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Access Suspended"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'dddd4444-4444-4444-4444-444444444444',
    'authenticated', 'authenticated', 'access-parent@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Access Parent"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'eeee5555-5555-5555-5555-555555555555',
    'authenticated', 'authenticated', 'access-student@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Access Student"}'::jsonb,
    now(), now()
  );

insert into organizations (name, org_type, grade_scheme)
values ('Access Co-op', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, 'aaaa1111-1111-1111-1111-111111111111', 'owner', 'active'
from organizations where name = 'Access Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'bbbb2222-2222-2222-2222-222222222222', 'instructor', 'active'
from organizations where name = 'Access Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'cccc3333-3333-3333-3333-333333333333', 'instructor', 'active'
from organizations where name = 'Access Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Access Biology', 'active', 'unpublished'
from organizations where name = 'Access Co-op';

insert into course_instructors (course_id, user_id)
select c.id, 'bbbb2222-2222-2222-2222-222222222222'
from courses c where c.title = 'Access Biology';

insert into course_instructors (course_id, user_id)
select c.id, 'cccc3333-3333-3333-3333-333333333333'
from courses c where c.title = 'Access Biology';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbb2222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbb2222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select lives_ok(
  $$update courses set title = 'Access Biology Edited' where title = 'Access Biology'$$,
  'active instructor can update a course they teach'
);
select results_eq(
  $$select title from courses where title = 'Access Biology Edited'$$,
  array['Access Biology Edited'::text],
  'instructor course update persists'
);

reset role;
delete from memberships
where user_id = 'bbbb2222-2222-2222-2222-222222222222';

select is_empty(
  $$select 1 from course_instructors
    where user_id = 'bbbb2222-2222-2222-2222-222222222222'$$,
  'removing a membership deletes that teacher''s course_instructors rows'
);

insert into course_instructors (course_id, user_id)
select c.id, 'bbbb2222-2222-2222-2222-222222222222'
from courses c where c.title = 'Access Biology Edited';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbb2222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbb2222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

update courses set title = 'Access Biology Hacked' where title = 'Access Biology Edited';

reset role;
select results_eq(
  $$select title from courses$$,
  array['Access Biology Edited'::text],
  'removed member cannot patch a course even with a leftover instructor row'
);

reset role;
update memberships
set status = 'suspended'
where user_id = 'cccc3333-3333-3333-3333-333333333333';

select is_empty(
  $$select 1 from course_instructors
    where user_id = 'cccc3333-3333-3333-3333-333333333333'$$,
  'suspending a membership deletes that teacher''s course_instructors rows'
);

insert into course_instructors (course_id, user_id)
select c.id, 'cccc3333-3333-3333-3333-333333333333'
from courses c where c.title = 'Access Biology Edited';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccc3333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"cccc3333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

update courses set title = 'Access Biology Suspended Hack' where title = 'Access Biology Edited';

reset role;
select results_eq(
  $$select title from courses$$,
  array['Access Biology Edited'::text],
  'suspended member cannot patch a course even with a leftover instructor row'
);

insert into org_profiles (organization_id, name, counts_as_student)
select id, 'Access Kid', true from organizations where name = 'Access Co-op';

insert into org_profiles (organization_id, name, email, user_id, counts_as_student)
select o.id, 'Access Parent', p.email, p.id, false
from organizations o
join profiles p on p.id = 'dddd4444-4444-4444-4444-444444444444'
where o.name = 'Access Co-op';

insert into parent_student_links (parent_org_profile_id, student_profile_id)
select parent.id, kid.id
from org_profiles kid
join org_profiles parent
  on parent.organization_id = kid.organization_id
 and parent.user_id = 'dddd4444-4444-4444-4444-444444444444'
where kid.name = 'Access Kid';

insert into memberships (organization_id, user_id, role, status)
select id, 'dddd4444-4444-4444-4444-444444444444', 'parent', 'active'
from organizations where name = 'Access Co-op';

select results_eq(
  $$select is_parent::text, is_student::text from memberships
    where user_id = 'dddd4444-4444-4444-4444-444444444444'$$,
  $$select 'true'::text, 'false'::text$$,
  'a parent membership sets the additive parent flag'
);

update memberships
set role = 'instructor'
where user_id = 'dddd4444-4444-4444-4444-444444444444';

select results_eq(
  $$select role, is_parent::text from memberships
    where user_id = 'dddd4444-4444-4444-4444-444444444444'$$,
  $$select 'instructor'::text, 'true'::text$$,
  'promoting a parent to instructor keeps parent'
);

update memberships
set role = 'admin'
where user_id = 'dddd4444-4444-4444-4444-444444444444';

select results_eq(
  $$select role, is_parent::text from memberships
    where user_id = 'dddd4444-4444-4444-4444-444444444444'$$,
  $$select 'admin'::text, 'true'::text$$,
  'a newer exclusive role replaces instructor and keeps parent'
);

update memberships
set role = 'parent'
where user_id = 'dddd4444-4444-4444-4444-444444444444';

select results_eq(
  $$select role, is_parent::text from memberships
    where user_id = 'dddd4444-4444-4444-4444-444444444444'$$,
  $$select 'parent'::text, 'true'::text$$,
  'removing the exclusive role leaves the parent membership'
);

insert into org_profiles (organization_id, name, user_id, counts_as_student)
select id, 'Access Student Kid', 'eeee5555-5555-5555-5555-555555555555', true
from organizations where name = 'Access Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'eeee5555-5555-5555-5555-555555555555', 'student', 'active'
from organizations where name = 'Access Co-op';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaa1111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaa1111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select throws_ok(
  $$update memberships set role = 'instructor'
    where user_id = 'eeee5555-5555-5555-5555-555555555555'$$,
  'P0001',
  'Students can''t be changed from the collaborators list.',
  'collaborators cannot promote a student'
);

select results_eq(
  $$select role from memberships
    where user_id = 'eeee5555-5555-5555-5555-555555555555'$$,
  array['student'::text],
  'student membership is unchanged after a blocked promotion'
);

reset role;
update memberships
set role = 'admin', is_student = true
where user_id = 'dddd4444-4444-4444-4444-444444444444';

select results_eq(
  $$select role, is_parent::text, is_student::text from memberships
    where user_id = 'dddd4444-4444-4444-4444-444444444444'$$,
  $$select 'admin'::text, 'true'::text, 'true'::text$$,
  'student plus admin keeps both additive flags under the exclusive role'
);

select * from finish();
rollback;
