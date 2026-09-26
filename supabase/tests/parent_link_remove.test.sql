-- remove_parent_from_student RPC and orphan parent org profile cleanup.
begin;
select plan(4);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'owner@example.com',
  extensions.crypt('pass', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Owner"}'::jsonb,
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
    values ('Link Test Co-op', 'coop', 'k12')$$,
  'owner creates org'
);

insert into org_profiles (organization_id, name, counts_as_student, parent_email)
select id, 'Kid One', true, 'parent@example.com' from organizations;

insert into org_profiles (organization_id, name, email, counts_as_student)
select id, 'Unclaimed Parent', 'parent@example.com', false from organizations;

insert into parent_student_links (parent_org_profile_id, student_profile_id)
select parent.id, kid.id
from org_profiles kid
join org_profiles parent
  on parent.organization_id = kid.organization_id
 and parent.name = 'Unclaimed Parent'
where kid.name = 'Kid One';

select lives_ok(
  $$select public.remove_parent_from_student(
    (select id from org_profiles where name = 'Kid One'),
    (select id from org_profiles where name = 'Unclaimed Parent')
  )$$,
  'owner removes parent link via rpc'
);

select is_empty(
  $$select 1
    from parent_student_links psl
    join org_profiles parent on parent.id = psl.parent_org_profile_id
    join org_profiles kid on kid.id = psl.student_profile_id
    where parent.name = 'Unclaimed Parent' and kid.name = 'Kid One'$$,
  'link row is gone'
);

select is_empty(
  $$select 1 from org_profiles where name = 'Unclaimed Parent'$$,
  'orphan parent org profile is deleted'
);

select results_eq(
  $$select parent_email from org_profiles where name = 'Kid One'$$,
  array[null::text],
  'student parent_email is cleared when last parent is removed'
);

select * from finish();
rollback;
