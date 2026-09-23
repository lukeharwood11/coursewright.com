-- Student role: claim sets student_profiles.user_id; published courses only.
begin;
select plan(6);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'eeee1111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'student-role-owner@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Student Role Owner"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'ffff2222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated', 'student-role-kid@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Student Role Kid"}'::jsonb,
    now(), now()
  );

insert into organizations (name, org_type, grade_scheme)
values ('Student Role Co-op', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, 'eeee1111-1111-1111-1111-111111111111', 'owner', 'active'
from organizations
where name = 'Student Role Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Student Role Offering', 'active', 'unpublished'
from organizations
where name = 'Student Role Co-op';

insert into student_profiles (organization_id, name, student_email)
select id, 'Kid Student Role', 'student-role-kid@example.com'
from organizations
where name = 'Student Role Co-op';

insert into enrollments (student_profile_id, course_id, status)
select sp.id, c.id, 'active'
from student_profiles sp
join courses c on c.organization_id = sp.organization_id
where sp.name = 'Kid Student Role';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'eeee1111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"eeee1111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into admin_invites (organization_id, email, role, student_profile_id)
    select o.id, 'student-role-kid@example.com', 'student', sp.id
    from organizations o
    join student_profiles sp on sp.organization_id = o.id
    where sp.name = 'Kid Student Role'$$,
  'staff can create a student invite'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'ffff2222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"ffff2222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select lives_ok(
  $$select claim_invite((
    select token from admin_invites
    where email = 'student-role-kid@example.com' and role = 'student'
  ))$$,
  'student claims their invite'
);

select results_eq(
  $$select role from memberships
    where user_id = 'ffff2222-2222-2222-2222-222222222222'$$,
  array['student'::text],
  'claim creates a student membership'
);

select results_eq(
  $$select user_id::text from student_profiles where name = 'Kid Student Role'$$,
  array['ffff2222-2222-2222-2222-222222222222'::text],
  'claim links student_profiles.user_id'
);

select is_empty(
  $$select * from courses where title = 'Student Role Offering'$$,
  'student cannot read an unpublished enrolled course'
);

reset role;
update courses set visibility = 'published' where title = 'Student Role Offering';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'ffff2222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"ffff2222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select results_eq(
  $$select title from courses where title = 'Student Role Offering'$$,
  array['Student Role Offering'::text],
  'student can read a published enrolled course'
);

select * from finish();
rollback;
