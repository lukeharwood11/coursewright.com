-- suspend_org_member, reactivate_org_member, remove_member_from_org
begin;
select plan(8);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'f0f01111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'om-owner@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"OM Owner"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'f0f02222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated', 'om-instructor@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"OM Instructor"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'f0f03333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated', 'om-student@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"OM Student"}'::jsonb,
    now(), now()
  );

insert into organizations (name, org_type, grade_scheme)
values ('Org Member Lab', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, 'f0f01111-1111-1111-1111-111111111111', 'owner', 'active'
from organizations where name = 'Org Member Lab';

insert into memberships (organization_id, user_id, role, status)
select id, 'f0f02222-2222-2222-2222-222222222222', 'instructor', 'active'
from organizations where name = 'Org Member Lab';

insert into org_profiles (organization_id, name, email, user_id, counts_as_student)
select o.id, 'OM Student', p.email, p.id, true
from organizations o
join profiles p on p.id = 'f0f03333-3333-3333-3333-333333333333'
where o.name = 'Org Member Lab';

insert into memberships (organization_id, user_id, role, status, is_student)
select o.id, p.id, 'student', 'active', true
from organizations o
join profiles p on p.id = 'f0f03333-3333-3333-3333-333333333333'
where o.name = 'Org Member Lab';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f0f01111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"f0f01111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.suspend_org_member(m.id)
    from memberships m
    join organizations o on o.id = m.organization_id
    where o.name = 'Org Member Lab'
      and m.user_id = 'f0f02222-2222-2222-2222-222222222222'$$,
  'owner can suspend an instructor'
);

select results_eq(
  $$select status from memberships
    where user_id = 'f0f02222-2222-2222-2222-222222222222'$$,
  array['suspended'::text],
  'instructor membership is suspended'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f0f02222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"f0f02222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is(
  (select private.is_org_member(o.id)
   from organizations o where o.name = 'Org Member Lab'),
  false,
  'suspended instructor is not an org member'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f0f01111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"f0f01111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.reactivate_org_member(m.id)
    from memberships m
    join organizations o on o.id = m.organization_id
    where o.name = 'Org Member Lab'
      and m.user_id = 'f0f02222-2222-2222-2222-222222222222'$$,
  'owner can reactivate a suspended instructor'
);

select results_eq(
  $$select status from memberships
    where user_id = 'f0f02222-2222-2222-2222-222222222222'$$,
  array['active'::text],
  'instructor membership is active again'
);

select lives_ok(
  $$select public.remove_member_from_org(m.id)
    from memberships m
    join organizations o on o.id = m.organization_id
    where o.name = 'Org Member Lab'
      and m.user_id = 'f0f03333-3333-3333-3333-333333333333'$$,
  'owner can remove a student member from the org'
);

select is_empty(
  $$select 1 from memberships
    where user_id = 'f0f03333-3333-3333-3333-333333333333'$$,
  'student membership row is deleted'
);

select is(
  (select user_id from org_profiles where name = 'OM Student'),
  null::uuid,
  'student org profile user_id is cleared after remove'
);

select throws_ok(
  $$select public.suspend_org_member(m.id)
    from memberships m
    join organizations o on o.id = m.organization_id
    where o.name = 'Org Member Lab'
      and m.user_id = 'f0f01111-1111-1111-1111-111111111111'$$,
  'P0001',
  'Owner access can''t be changed here.',
  'cannot suspend an owner'
);

reset role;

select * from finish();
rollback;
