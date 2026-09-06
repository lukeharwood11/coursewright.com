-- RLS for docs/database/SCHEMA.md: org management + course access + parent gate.
begin;
select plan(21);

-- auth.users insert so private.handle_new_user() creates profiles.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'admin@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Ada Admin"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated', 'teacher@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Ivy Instructor"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated', 'parent@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Pat Parent"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444444',
    'authenticated', 'authenticated', 'second-admin@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Alex Admin"}'::jsonb,
    now(), now()
  );

select ok(
  not has_table_privilege('anon', 'public.organizations', 'select'),
  'anon has no select grant on organizations'
);
select ok(
  not has_table_privilege('anon', 'public.courses', 'select'),
  'anon has no select grant on courses'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into organizations (name, org_type, grade_scheme)
    values ('Oak Co-op', 'coop', 'k12')$$,
  'signed-in user can create an organization'
);

select results_eq(
  $$select role from memberships$$,
  array['owner'::text],
  'org creator is the first owner'
);

select ok(
  (select slug from organizations) is not null,
  'organization slug is generated on create'
);

select lives_ok(
  $$update organizations set name = 'Oak Cooperative'$$,
  'owner can update the organization'
);
select results_eq(
  $$select name from organizations$$,
  array['Oak Cooperative'::text],
  'owner update persists'
);

-- Last remaining owner cannot demote themselves.
select throws_ok(
  $$update memberships set role = 'instructor'
    where user_id = '11111111-1111-1111-1111-111111111111'$$,
  'P0001',
  'cannot remove or demote the last remaining owner or admin',
  'cannot demote the last owner'
);

insert into memberships (organization_id, user_id, role, status)
select id, '44444444-4444-4444-4444-444444444444', 'admin', 'active'
from organizations;

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}',
  true
);

select lives_ok(
  $$update organizations set name = 'Oak by Admin'$$,
  'admin can update the organization'
);
select results_eq(
  $$select name from organizations$$,
  array['Oak by Admin'::text],
  'admin update persists'
);

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

insert into memberships (organization_id, user_id, role, status)
select id, '22222222-2222-2222-2222-222222222222', 'instructor', 'active'
from organizations;

insert into courses (organization_id, title)
select id, 'Biology'
from organizations;

select results_eq(
  $$select title from courses$$,
  array['Biology'::text],
  'admin reads the org course'
);

-- A different org's instructor cannot see this org.
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

update organizations set name = 'Hacked';
select results_eq(
  $$select name from organizations$$,
  array['Oak by Admin'::text],
  'instructor cannot rename the organization'
);

select results_eq(
  $$select title from courses$$,
  array['Biology'::text],
  'instructor in the org reads the course'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from organizations$$,
  'unrelated user sees no organizations'
);
select is_empty(
  $$select * from courses$$,
  'unrelated user sees no courses'
);

-- Seed parent access as table owner, then verify the SCHEMA.md parent gate.
reset role;

insert into student_profiles (organization_id, name)
select id, 'Sam Student' from organizations;

insert into enrollments (student_profile_id, course_id, status)
select sp.id, c.id, 'active'
from student_profiles sp
join courses c on c.organization_id = sp.organization_id;

insert into parent_student_links (parent_user_id, student_profile_id)
select '33333333-3333-3333-3333-333333333333', id from student_profiles;

-- Parent membership but course archived → still hidden.
insert into memberships (organization_id, user_id, role, status)
select id, '33333333-3333-3333-3333-333333333333', 'parent', 'active'
from organizations;

update courses set status = 'archived';

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from courses$$,
  'parent does not see archived courses'
);

reset role;
update courses set status = 'active';

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select results_eq(
  $$select title from courses$$,
  array['Biology'::text],
  'parent sees an active course with linked enrolled student'
);

select isnt_empty(
  $$select 1 from student_profiles where name = 'Sam Student'$$,
  'parent reads the linked student profile'
);

reset role;
update enrollments set status = 'withdrawn';

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from courses$$,
  'parent loses course visibility when enrollment is not active'
);

select results_eq(
  $$select role from memberships where user_id = '33333333-3333-3333-3333-333333333333'$$,
  array['parent'::text],
  'parent membership stays after enrollment ends'
);

update organizations set name = 'Parent Hack';
select results_eq(
  $$select name from organizations$$,
  array['Oak by Admin'::text],
  'parent cannot rename the organization'
);

select * from finish();
rollback;
