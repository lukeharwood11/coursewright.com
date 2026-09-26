-- Unpublished materials are staff-only; published materials are visible to enrolled parents.
begin;
select plan(4);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaa1111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'vis-admin@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Vis Admin"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbb2222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated', 'vis-parent@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Vis Parent"}'::jsonb,
    now(), now()
  );

insert into organizations (name, org_type, grade_scheme)
values ('Visibility Co-op', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, 'aaaa1111-1111-1111-1111-111111111111', 'owner', 'active'
from organizations
where name = 'Visibility Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'bbbb2222-2222-2222-2222-222222222222', 'parent', 'active'
from organizations
where name = 'Visibility Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Drafting', 'active', 'published'
from organizations
where name = 'Visibility Co-op';

insert into org_profiles (organization_id, name, counts_as_student)
select id, 'Kid Visibility', true
from organizations
where name = 'Visibility Co-op';

insert into enrollments (student_profile_id, course_id, status)
select sp.id, c.id, 'active'
from org_profiles sp
join courses c on c.organization_id = sp.organization_id
where sp.name = 'Kid Visibility';

insert into parent_student_links (parent_org_profile_id, student_profile_id)
select parent.id, kid.id
from org_profiles kid
join org_profiles parent
  on parent.organization_id = kid.organization_id
 and parent.user_id = 'bbbb2222-2222-2222-2222-222222222222'
where kid.name = 'Kid Visibility';

insert into materials (
  organization_id, course_id, title, description, kind, visibility
)
select o.id, c.id, 'Hidden draft', '', 'page', 'unpublished'
from organizations o
join courses c on c.organization_id = o.id
where o.name = 'Visibility Co-op';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaa1111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaa1111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select results_eq(
  $$select title from materials where title = 'Hidden draft'$$,
  array['Hidden draft'::text],
  'instructor/admin can read unpublished materials'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbb2222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbb2222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from materials where title = 'Hidden draft'$$,
  'parent cannot read unpublished materials'
);

reset role;
update materials set visibility = 'published' where title = 'Hidden draft';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbb2222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbb2222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select results_eq(
  $$select title from materials where title = 'Hidden draft'$$,
  array['Hidden draft'::text],
  'parent can read published materials in an active enrolled course'
);

reset role;
update materials set visibility = 'unpublished' where title = 'Hidden draft';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbb2222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbb2222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from materials where title = 'Hidden draft'$$,
  'unpublishing hides the material from parents again'
);

select * from finish();
rollback;
