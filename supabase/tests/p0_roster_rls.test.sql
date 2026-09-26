-- RLS for classes / class_members and staff writes on student_profiles + enrollments.
begin;
select plan(10);

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

insert into memberships (organization_id, user_id, role, status)
select id, '22222222-2222-2222-2222-222222222222', 'instructor', 'active'
from organizations;

select lives_ok(
  $$insert into org_profiles (organization_id, name, counts_as_student)
    select id, 'Sam Student', true from organizations$$,
  'owner can create a student profile'
);

select lives_ok(
  $$insert into classes (organization_id, title)
    select id, 'Wednesday cohort' from organizations$$,
  'owner can create a class'
);

insert into class_members (class_id, student_profile_id)
select c.id, sp.id
from classes c
join org_profiles sp on sp.organization_id = c.organization_id
where sp.name = 'Sam Student';

select results_eq(
  $$select title from classes$$,
  array['Wednesday cohort'::text],
  'owner reads the class'
);

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select results_eq(
  $$select title from classes$$,
  array['Wednesday cohort'::text],
  'instructor in the org reads the class'
);

select lives_ok(
  $$insert into org_profiles (organization_id, name, counts_as_student)
    select id, 'Lee Learner', true from organizations$$,
  'instructor can create a student profile'
);

insert into courses (organization_id, title)
select id, 'Biology' from organizations;

select lives_ok(
  $$insert into enrollments (student_profile_id, course_id, status)
    select sp.id, c.id, 'active'
    from org_profiles sp
    join courses c on c.organization_id = sp.organization_id
    where sp.name = 'Lee Learner'$$,
  'instructor can enroll a student'
);

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from classes$$,
  'unrelated user sees no classes'
);

select is_empty(
  $$select * from class_members$$,
  'unrelated user sees no class members'
);

reset role;
insert into org_profiles (organization_id, name, email, user_id, counts_as_student)
select o.id, 'Roster Parent', p.email, p.id, false
from organizations o
join profiles p on p.id = '33333333-3333-3333-3333-333333333333';

insert into parent_student_links (parent_org_profile_id, student_profile_id)
select parent.id, kid.id
from org_profiles kid
join org_profiles parent
  on parent.organization_id = kid.organization_id
 and parent.user_id = '33333333-3333-3333-3333-333333333333'
where kid.name = 'Lee Learner';

insert into memberships (organization_id, user_id, role, status)
select id, '33333333-3333-3333-3333-333333333333', 'parent', 'active'
from organizations;

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from classes$$,
  'parent does not see classes'
);

select * from finish();
rollback;
