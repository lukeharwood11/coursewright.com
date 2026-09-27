-- Org person claim, same-email merge, pre-claim placement, and name split.
begin;
select plan(34);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111178',
    'authenticated', 'authenticated', 'owner78@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Account Owner"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222278',
    'authenticated', 'authenticated', 'ada78@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Account Ada"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333378',
    'authenticated', 'authenticated', 'pat78@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Account Pat"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-8444-444444444478',
    'authenticated', 'authenticated', 'observer78@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Account Observer"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-4555-8555-555555555578',
    'authenticated', 'authenticated', 'invitesam78@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Account Sam"}'::jsonb,
    now(), now()
  );

insert into organizations (name, org_type, grade_scheme)
values ('Org Profiles Co-op', 'coop', 'k12'), ('Other Profiles Co-op', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, '11111111-1111-4111-8111-111111111178', 'owner', 'active'
from organizations where name = 'Org Profiles Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, '44444444-4444-4444-8444-444444444478', 'observer', 'active'
from organizations where name = 'Org Profiles Co-op';

update org_profiles
set name = 'Org Observer'
where user_id = '44444444-4444-4444-8444-444444444478';

insert into org_profiles (organization_id, name, email, counts_as_student)
select id, 'Org Ada', 'ada78@example.com', false
from organizations where name = 'Org Profiles Co-op';

insert into org_profiles (organization_id, name, email, counts_as_student)
select id, 'Org Bea', 'bea78@example.com', false
from organizations where name = 'Org Profiles Co-op';

insert into org_profiles (organization_id, name, email, counts_as_student)
select id, 'Org Pat', 'pat78@example.com', false
from organizations where name = 'Org Profiles Co-op';

insert into org_profiles (organization_id, name, email, counts_as_student)
select id, 'Kept Student', 'kept78@example.com', true
from organizations where name = 'Org Profiles Co-op';

insert into org_profiles (organization_id, name, counts_as_student)
select id, 'Enroll Child', true
from organizations where name = 'Org Profiles Co-op';

insert into org_profiles (organization_id, name, email, counts_as_student)
select id, 'Staff Sam', 'mergesam78@example.com', false
from organizations where name = 'Org Profiles Co-op';

insert into org_profiles (organization_id, name, email, counts_as_student)
select id, 'Invite Sam', 'invitesam78@example.com', false
from organizations where name = 'Org Profiles Co-op';

insert into org_profiles (organization_id, name, email, counts_as_student)
select id, 'Other Person', 'other78@example.com', false
from organizations where name = 'Other Profiles Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Placement Course', 'active', 'unpublished'
from organizations where name = 'Org Profiles Co-op';

insert into classes (organization_id, title)
select id, 'Placement Class'
from organizations where name = 'Org Profiles Co-op';

insert into admin_invites (organization_id, email, invited_by, role, org_profile_id)
select o.id, 'ada78@example.com', '11111111-1111-4111-8111-111111111178', 'instructor', op.id
from organizations o
join org_profiles op on op.organization_id = o.id and op.email = 'ada78@example.com'
where o.name = 'Org Profiles Co-op';

insert into admin_invites (organization_id, email, invited_by, role, org_profile_id)
select o.id, 'bea78@example.com', '11111111-1111-4111-8111-111111111178', 'instructor', op.id
from organizations o
join org_profiles op on op.organization_id = o.id and op.email = 'bea78@example.com'
where o.name = 'Org Profiles Co-op';

insert into admin_invites (organization_id, email, invited_by, role, org_profile_id, student_profile_id)
select o.id, 'pat78@example.com', '11111111-1111-4111-8111-111111111178', 'parent', parent.id, child.id
from organizations o
join org_profiles parent on parent.organization_id = o.id and parent.email = 'pat78@example.com'
join org_profiles child on child.organization_id = o.id and child.name = 'Enroll Child'
where o.name = 'Org Profiles Co-op';

insert into admin_invites (organization_id, email, invited_by, role)
select o.id, 'kept78@example.com', '11111111-1111-4111-8111-111111111178', 'instructor'
from organizations o
where o.name = 'Org Profiles Co-op';

insert into admin_invites (
  organization_id, email, invited_by, role, student_profile_id, org_profile_id
)
select o.id, 'invitesam78@example.com', '11111111-1111-4111-8111-111111111178', 'student', op.id, op.id
from organizations o
join org_profiles op on op.organization_id = o.id and op.email = 'invitesam78@example.com'
where o.name = 'Org Profiles Co-op';

insert into course_instructors (course_id, org_profile_id)
select c.id, op.id
from courses c
join organizations o on o.id = c.organization_id and o.name = 'Org Profiles Co-op'
join org_profiles op on op.organization_id = o.id and op.email in ('ada78@example.com', 'bea78@example.com')
where c.title = 'Placement Course';

insert into class_leaders (class_id, org_profile_id)
select k.id, op.id
from classes k
join organizations o on o.id = k.organization_id and o.name = 'Org Profiles Co-op'
join org_profiles op on op.organization_id = o.id and op.email = 'ada78@example.com'
where k.title = 'Placement Class';

insert into enrollments (student_profile_id, course_id)
select child.id, c.id
from org_profiles child
join organizations o on o.id = child.organization_id and o.name = 'Org Profiles Co-op'
join courses c on c.organization_id = o.id and c.title = 'Placement Course'
where child.name = 'Enroll Child';

insert into parent_student_links (parent_org_profile_id, student_profile_id)
select parent.id, child.id
from org_profiles parent
join org_profiles child on child.organization_id = parent.organization_id and child.name = 'Enroll Child'
where parent.email = 'pat78@example.com';

select ok(
  (select bool_and(ci.user_id is null)
   from course_instructors ci
   join courses c on c.id = ci.course_id and c.title = 'Placement Course'),
  'pre-claim course teachers have no account'
);

select is(
  (select count(*)::int
   from course_instructors ci
   join courses c on c.id = ci.course_id and c.title = 'Placement Course'),
  2,
  'two unclaimed people can both be course teachers'
);

select ok(
  (select cl.user_id is null
   from class_leaders cl
   join classes k on k.id = cl.class_id and k.title = 'Placement Class'),
  'pre-claim class lead has no account'
);

select is(
  (select count(*)::int from enrollments e
   join org_profiles op on op.id = e.student_profile_id
   where op.name = 'Enroll Child'),
  1,
  'an unclaimed student can be enrolled'
);

select ok(
  (select parent.user_id is null
   from parent_student_links psl
   join org_profiles parent on parent.id = psl.parent_org_profile_id
   where parent.email = 'pat78@example.com'),
  'a parent link can exist before the parent claims'
);

select is(
  (select count(*)::int from org_profiles
   where email = 'kept78@example.com'),
  1,
  'a staff invite reuses the student with the same contact email'
);

select is(
  (select op.name
   from admin_invites i
   join org_profiles op on op.id = i.org_profile_id
   where i.email = 'kept78@example.com' and i.role = 'instructor'),
  'Kept Student',
  'same-email merge keeps the student name'
);

select is(
  (select counts_as_student from org_profiles where email = 'kept78@example.com'),
  true,
  'same-email merge keeps the student flag'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222278', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222278","role":"authenticated"}',
  true
);

select is(
  (select private.is_course_instructor(c.id)
   from courses c
   where c.title = 'Placement Course'),
  false,
  'an unclaimed placement cannot manage the course'
);

select lives_ok(
  $$select claim_invite((select token from admin_invites where email = 'ada78@example.com' and role = 'instructor'))$$,
  'instructor claims without renaming either profile'
);

select is(
  (select name from org_profiles where email = 'ada78@example.com'),
  'Org Ada',
  'claim leaves the org name alone'
);

select is(
  (select name from profiles where id = '22222222-2222-4222-8222-222222222278'),
  'Account Ada',
  'claim leaves the account name alone'
);

select is(
  (select ci.user_id::text
   from course_instructors ci
   join org_profiles op on op.id = ci.org_profile_id
   where op.email = 'ada78@example.com'),
  '22222222-2222-4222-8222-222222222278',
  'claim fills the course teacher account'
);

select is(
  (select cl.user_id::text
   from class_leaders cl
   join org_profiles op on op.id = cl.org_profile_id
   where op.email = 'ada78@example.com'),
  '22222222-2222-4222-8222-222222222278',
  'claim fills the class lead account'
);

select is(
  (select private.is_course_instructor(c.id)
   from courses c
   where c.title = 'Placement Course'),
  true,
  'after claim the placement can manage the course'
);

select ok(
  (select ci.user_id is null
   from course_instructors ci
   join org_profiles op on op.id = ci.org_profile_id
   where op.email = 'bea78@example.com'),
  'claiming one person does not fill another placement'
);

reset role;
update profiles
set name = 'Renamed Account'
where id = '22222222-2222-4222-8222-222222222278';

select is(
  (select name from org_profiles where email = 'ada78@example.com'),
  'Org Ada',
  'an account rename does not change the org name'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111178', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111178","role":"authenticated"}',
  true
);

select lives_ok(
  $$update org_profiles set email = 'ada-contact78@example.com' where email = 'ada78@example.com'$$,
  'owner can change a contact email'
);

select is(
  (select user_id::text from org_profiles where email = 'ada-contact78@example.com'),
  '22222222-2222-4222-8222-222222222278',
  'changing the contact email keeps the login'
);

select lives_ok(
  $$select mark_org_profile_as_student(
    (select id from org_profiles where email = 'mergesam78@example.com'),
    null,
    null,
    null
  )$$,
  'staff can mark an existing person as a student'
);

select is(
  (select name from org_profiles where email = 'mergesam78@example.com'),
  'Staff Sam',
  'marking a person as a student keeps their org name'
);

select is(
  (select counts_as_student from org_profiles where email = 'mergesam78@example.com'),
  true,
  'marking a person as a student sets the student flag'
);

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555578', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555578","role":"authenticated"}',
  true
);

select lives_ok(
  $$select claim_invite((select token from admin_invites where email = 'invitesam78@example.com' and role = 'student'))$$,
  'student claim on a staff row stacks the student flag'
);

select is(
  (select name from org_profiles where email = 'invitesam78@example.com'),
  'Invite Sam',
  'student claim does not rename the org profile'
);

select is(
  (select counts_as_student from org_profiles where email = 'invitesam78@example.com'),
  true,
  'student claim sets counts_as_student'
);

select is(
  (select name from profiles where id = '55555555-5555-4555-8555-555555555578'),
  'Account Sam',
  'student claim does not rename the account'
);

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333378', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333378","role":"authenticated"}',
  true
);

select lives_ok(
  $$select claim_invite((select token from admin_invites where email = 'pat78@example.com' and role = 'parent'))$$,
  'parent claim uses the existing org profile'
);

select is(
  (select name from org_profiles where email = 'pat78@example.com'),
  'Org Pat',
  'parent claim does not rename the org profile'
);

select is(
  (select user_id::text from org_profiles where email = 'pat78@example.com'),
  '33333333-3333-4333-8333-333333333378',
  'parent claim links the account'
);

select is(
  (select count(*)::int
   from parent_student_links psl
   join org_profiles parent on parent.id = psl.parent_org_profile_id
   where parent.email = 'pat78@example.com'),
  1,
  'parent claim does not duplicate the pre-claim link'
);

select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444478', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-8444-444444444478","role":"authenticated"}',
  true
);

select lives_ok(
  $$update org_profiles set name = 'Observer Chosen' where user_id = '44444444-4444-4444-8444-444444444478'$$,
  'observer can rename themselves in the organization'
);

select throws_ok(
  $$update org_profiles set email = 'observer-new78@example.com' where user_id = '44444444-4444-4444-8444-444444444478'$$,
  '42501',
  'You can’t change that email.',
  'observer cannot change their org email'
);

select is(
  (select name from profiles where id = '44444444-4444-4444-8444-444444444478'),
  'Account Observer',
  'an org rename does not change the account name'
);

reset role;

select throws_ok(
  $$insert into course_instructors (course_id, org_profile_id)
    select c.id, op.id
    from courses c
    join organizations o on o.id = c.organization_id and o.name = 'Org Profiles Co-op'
    join org_profiles op on op.email = 'other78@example.com'
    where c.title = 'Placement Course'$$,
  'P0001',
  'Choose a person in this organization.',
  'a course teacher must belong to the course organization'
);

select * from finish();
rollback;
