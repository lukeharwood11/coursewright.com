-- Families are directory convenience. Access stays enrollment + parent_student_links.
begin;
select plan(10);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'f1111111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'family-admin@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Fay Admin"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'f2222222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated', 'family-parent@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Fay Parent"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'f3333333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated', 'family-outsider@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Fay Outsider"}'::jsonb,
    now(), now()
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into organizations (name, org_type, grade_scheme)
    values ('Family Co-op', 'coop', 'k12')$$,
  'signed-in user can create an organization'
);

select lives_ok(
  $$insert into families (organization_id, display_name)
    select id, 'The Testers' from organizations where name = 'Family Co-op'$$,
  'owner can create a family'
);

select lives_ok(
  $$insert into student_profiles (organization_id, name)
    select id, 'Sam Sibling' from organizations where name = 'Family Co-op'$$,
  'owner can create a student profile'
);

select lives_ok(
  $$insert into family_members (family_id, student_profile_id, display_name)
    select f.id, sp.id, sp.name
    from families f
    join student_profiles sp on sp.organization_id = f.organization_id
    where f.display_name = 'The Testers'
      and sp.name = 'Sam Sibling'$$,
  'owner can add a student family member'
);

select lives_ok(
  $$insert into family_members (family_id, parent_user_id, display_name)
    select f.id, 'f2222222-2222-2222-2222-222222222222', 'Fay Parent'
    from families f
    where f.display_name = 'The Testers'$$,
  'owner can add a parent family member'
);

select lives_ok(
  $$insert into parent_student_links (parent_user_id, student_profile_id)
    select 'f2222222-2222-2222-2222-222222222222', sp.id
    from student_profiles sp
    where sp.name = 'Sam Sibling'$$,
  'owner can create a parent-student link'
);

insert into families (organization_id, display_name)
select id, 'Other household' from organizations where name = 'Family Co-op';

select throws_ok(
  $$insert into family_members (family_id, student_profile_id, display_name)
    select f.id, sp.id, sp.name
    from families f
    join student_profiles sp on sp.organization_id = f.organization_id
    where f.display_name = 'Other household'
      and sp.name = 'Sam Sibling'$$,
  '23505',
  NULL,
  'student belongs to at most one family'
);

insert into courses (organization_id, title, status, visibility)
select id, 'Published offering', 'active', 'published'
from organizations
where name = 'Family Co-op';

insert into enrollments (student_profile_id, course_id, status)
select sp.id, c.id, 'active'
from student_profiles sp
join courses c on c.organization_id = sp.organization_id
where sp.name = 'Sam Sibling'
  and c.title = 'Published offering';

reset role;
insert into memberships (organization_id, user_id, role, status)
select id, 'f2222222-2222-2222-2222-222222222222', 'parent', 'active'
from organizations
where name = 'Family Co-op';

delete from parent_student_links
where parent_user_id = 'f2222222-2222-2222-2222-222222222222';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f2222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"f2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from courses where title = 'Published offering'$$,
  'family membership without parent_student_links does not grant course access'
);

reset role;
insert into parent_student_links (parent_user_id, student_profile_id)
select 'f2222222-2222-2222-2222-222222222222', id
from student_profiles
where name = 'Sam Sibling';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f2222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"f2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select results_eq(
  $$select title from courses where title = 'Published offering'$$,
  array['Published offering'::text],
  'parent sees the course after parent_student_links exists'
);

reset role;
delete from family_members
where parent_user_id = 'f2222222-2222-2222-2222-222222222222';

select isnt_empty(
  $$select 1 from parent_student_links
    where parent_user_id = 'f2222222-2222-2222-2222-222222222222'$$,
  'removing a family member does not delete parent_student_links'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f3333333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"f3333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from families$$,
  'unrelated user sees no families'
);

select * from finish();
rollback;
