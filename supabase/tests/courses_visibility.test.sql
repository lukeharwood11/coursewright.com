-- Unpublished courses are staff-only; parents need active + published.
begin;
select plan(4);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'cccc1111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'course-vis-admin@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Course Vis Admin"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'dddd2222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated', 'course-vis-parent@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Course Vis Parent"}'::jsonb,
    now(), now()
  );

insert into organizations (name, org_type, grade_scheme)
values ('Course Visibility Co-op', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, 'cccc1111-1111-1111-1111-111111111111', 'owner', 'active'
from organizations
where name = 'Course Visibility Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'dddd2222-2222-2222-2222-222222222222', 'parent', 'active'
from organizations
where name = 'Course Visibility Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Draft offering', 'active', 'unpublished'
from organizations
where name = 'Course Visibility Co-op';

insert into org_profiles (organization_id, name, counts_as_student)
select id, 'Kid Course Visibility', true
from organizations
where name = 'Course Visibility Co-op';

insert into enrollments (student_profile_id, course_id, status)
select sp.id, c.id, 'active'
from org_profiles sp
join courses c on c.organization_id = sp.organization_id
where sp.name = 'Kid Course Visibility';

insert into parent_student_links (parent_org_profile_id, student_profile_id)
select parent.id, kid.id
from org_profiles kid
join org_profiles parent
  on parent.organization_id = kid.organization_id
 and parent.user_id = 'dddd2222-2222-2222-2222-222222222222'
where kid.name = 'Kid Course Visibility';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccc1111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"cccc1111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select results_eq(
  $$select title from courses where title = 'Draft offering'$$,
  array['Draft offering'::text],
  'instructor/admin can read unpublished courses'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddd2222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"dddd2222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from courses where title = 'Draft offering'$$,
  'parent cannot read an unpublished active enrolled course'
);

reset role;
update courses set visibility = 'published' where title = 'Draft offering';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddd2222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"dddd2222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select results_eq(
  $$select title from courses where title = 'Draft offering'$$,
  array['Draft offering'::text],
  'parent can read a published active enrolled course'
);

reset role;
update courses set visibility = 'unpublished' where title = 'Draft offering';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddd2222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"dddd2222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from courses where title = 'Draft offering'$$,
  'unpublishing hides the course from parents again'
);

select * from finish();
rollback;
