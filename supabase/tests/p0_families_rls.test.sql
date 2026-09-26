-- Families are a named group of student_profiles (Class-mirror).
-- Parents appear via parent_student_links only — not family_members.parent_user_id.
begin;
select plan(15);

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
  'owner can create a named family'
);

select lives_ok(
  $$insert into org_profiles (organization_id, name, counts_as_student)
    select id, 'Sam Sibling', true from organizations where name = 'Family Co-op'$$,
  'owner can create a student profile'
);

select lives_ok(
  $$insert into family_members (family_id, student_profile_id, display_name)
    select f.id, sp.id, sp.name
    from families f
    join org_profiles sp on sp.organization_id = f.organization_id
    where f.display_name = 'The Testers'
      and sp.name = 'Sam Sibling'$$,
  'owner can add a student family member'
);

select lives_ok(
  $$with parent_person as (
      insert into org_profiles (organization_id, name, email, user_id, counts_as_student)
      select sp.organization_id, 'Fay Parent', 'family-parent@example.com',
        'f2222222-2222-2222-2222-222222222222', false
      from org_profiles sp
      where sp.name = 'Sam Sibling'
      returning id, organization_id
    )
    insert into parent_student_links (parent_org_profile_id, student_profile_id)
    select parent_person.id, sp.id
    from parent_person
    join org_profiles sp on sp.organization_id = parent_person.organization_id
    where sp.name = 'Sam Sibling'$$,
  'owner can create a parent-student link'
);

select lives_ok(
  $$insert into admin_invites (organization_id, email, role, student_profile_id, invited_by)
    select o.id, 'pending-parent@example.com', 'parent', sp.id,
      'f1111111-1111-1111-1111-111111111111'
    from organizations o
    join org_profiles sp on sp.organization_id = o.id
    where o.name = 'Family Co-op' and sp.name = 'Sam Sibling'$$,
  'owner can save a pending parent invite on admin_invites'
);

select throws_ok(
  $$insert into admin_invites (organization_id, email, role, student_profile_id, invited_by)
    select o.id, 'pending-parent@example.com', 'parent', sp.id,
      'f1111111-1111-1111-1111-111111111111'
    from organizations o
    join org_profiles sp on sp.organization_id = o.id
    where o.name = 'Family Co-op' and sp.name = 'Sam Sibling'$$,
  'P0001',
  'That email already has a pending invite.',
  'pending parent invite is unique per org, email, and student'
);

select isnt_empty(
  $$select 1 from admin_invites
    where role = 'parent'
      and email = 'pending-parent@example.com'
      and accepted_at is null$$,
  'staff can list pending parent invites for family students'
);

insert into families (organization_id, display_name)
select id, 'Other household' from organizations where name = 'Family Co-op';

select throws_ok(
  $$insert into family_members (family_id, student_profile_id, display_name)
    select f.id, sp.id, sp.name
    from families f
    join org_profiles sp on sp.organization_id = f.organization_id
    where f.display_name = 'Other household'
      and sp.name = 'Sam Sibling'$$,
  '23505',
  NULL,
  'student belongs to at most one family'
);

insert into org_profiles (organization_id, name, counts_as_student)
select id, 'Lee Learner', true from organizations where name = 'Family Co-op';

insert into family_members (family_id, student_profile_id, display_name)
select f.id, sp.id, sp.name
from families f
join org_profiles sp on sp.organization_id = f.organization_id
where f.display_name = 'Other household'
  and sp.name = 'Lee Learner';

select lives_ok(
  $$insert into parent_student_links (parent_org_profile_id, student_profile_id)
    select parent.id, sp.id
    from org_profiles sp
    join org_profiles parent
      on parent.organization_id = sp.organization_id
     and parent.user_id = 'f2222222-2222-2222-2222-222222222222'
    where sp.name = 'Lee Learner'$$,
  'same parent can link to students in two families'
);

insert into courses (organization_id, title, status, visibility)
select id, 'Published offering', 'active', 'published'
from organizations
where name = 'Family Co-op';

insert into enrollments (student_profile_id, course_id, status)
select sp.id, c.id, 'active'
from org_profiles sp
join courses c on c.organization_id = sp.organization_id
where sp.name = 'Sam Sibling'
  and c.title = 'Published offering';

reset role;
insert into memberships (organization_id, user_id, role, status)
select id, 'f2222222-2222-2222-2222-222222222222', 'parent', 'active'
from organizations
where name = 'Family Co-op';

-- Poison-pill: parent_user_id on family_members must not be an access gate.
insert into family_members (family_id, parent_user_id, display_name)
select f.id, 'f2222222-2222-2222-2222-222222222222', 'Fay Parent'
from families f
where f.display_name = 'The Testers';

delete from parent_student_links
where parent_org_profile_id = (
  select id from org_profiles
  where user_id = 'f2222222-2222-2222-2222-222222222222'
)
  and student_profile_id = (
    select id from org_profiles where name = 'Sam Sibling'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f2222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"f2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from courses where title = 'Published offering'$$,
  'family_members.parent_user_id without parent_student_links does not grant course access'
);

reset role;
insert into parent_student_links (parent_org_profile_id, student_profile_id)
select parent.id, kid.id
from org_profiles kid
join org_profiles parent
  on parent.organization_id = kid.organization_id
 and parent.user_id = 'f2222222-2222-2222-2222-222222222222'
where kid.name = 'Sam Sibling';

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
where student_profile_id = (
  select id from org_profiles where name = 'Sam Sibling'
);

select isnt_empty(
  $$select 1 from parent_student_links psl
    join org_profiles parent on parent.id = psl.parent_org_profile_id
    where parent.user_id = 'f2222222-2222-2222-2222-222222222222'
      and psl.student_profile_id = (
        select id from org_profiles where name = 'Sam Sibling'
      )$$,
  'removing a student from a family does not delete parent_student_links'
);

reset role;
select set_config(
  'test.family_org_id',
  (select id::text from organizations where name = 'Family Co-op'),
  true
);
select set_config(
  'test.sam_id',
  (
    select sp.id::text
    from org_profiles sp
    where sp.organization_id = current_setting('test.family_org_id')::bigint
      and sp.name = 'Sam Sibling'
  ),
  true
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

select throws_ok(
  $$insert into admin_invites (organization_id, email, role, student_profile_id, invited_by)
    values (
      current_setting('test.family_org_id')::bigint,
      'outsider-invite@example.com',
      'parent',
      current_setting('test.sam_id')::bigint,
      'f3333333-3333-3333-3333-333333333333'
    )$$,
  '42501',
  NULL,
  'unrelated user cannot write parent invites'
);

select * from finish();
rollback;
