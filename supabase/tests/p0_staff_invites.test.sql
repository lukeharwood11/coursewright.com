-- Staff invite create / claim / email-match (docs/database/SCHEMA.md AdminInvite).
begin;
select plan(11);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'authenticated', 'authenticated', 'owner@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Olive Owner"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'authenticated', 'authenticated', 'admin@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Ada Admin"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'authenticated', 'authenticated', 'teacher@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Ivy Instructor"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'authenticated', 'authenticated', 'outsider@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Omar Outsider"}'::jsonb,
    now(), now()
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

insert into organizations (name, org_type, grade_scheme)
values ('Cedar Co-op', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'admin', 'active'
from organizations;

select lives_ok(
  $$insert into admin_invites (organization_id, email, role)
    select id, 'teacher@example.com', 'instructor' from organizations$$,
  'owner can invite an instructor'
);

select throws_ok(
  $$insert into admin_invites (organization_id, email, role)
    select id, 'teacher@example.com', 'instructor' from organizations$$,
  '23505',
  'duplicate key value violates unique constraint "admin_invites_pending_org_email"',
  'duplicate pending invite for the same email is rejected'
);

select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);

select throws_ok(
  $$insert into admin_invites (organization_id, email, role)
    select id, 'new-owner@example.com', 'owner' from organizations$$,
  '42501',
  'Only an owner can invite another owner.',
  'admin cannot invite an owner'
);

select lives_ok(
  $$insert into admin_invites (organization_id, email, role)
    select id, 'second-admin@example.com', 'admin' from organizations$$,
  'admin can invite another admin'
);

reset role;
create temp table invite_tokens as
  select email, token from admin_invites;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}',
  true
);

select results_eq(
  $$select role from admin_invites where accepted_at is null$$,
  array['instructor'::text],
  'invitee reads their pending staff invite'
);

select results_eq(
  $$select name from organizations$$,
  array['Cedar Co-op'::text],
  'invitee can see the invited organization before accepting'
);

select is_empty(
  $$select token from admin_invites where email = 'second-admin@example.com'$$,
  'invitee does not see someone else’s pending invite'
);

select lives_ok(
  $$select claim_staff_invite((select token from invite_tokens where email = 'teacher@example.com'))$$,
  'invitee claims their instructor invite'
);

select results_eq(
  $$select role from memberships where user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'$$,
  array['instructor'::text],
  'claim creates an instructor membership'
);

select set_config('request.jwt.claim.sub', 'dddddddd-dddd-dddd-dddd-dddddddddddd', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"dddddddd-dddd-dddd-dddd-dddddddddddd","role":"authenticated"}',
  true
);

select throws_ok(
  $$select claim_staff_invite((select token from invite_tokens where email = 'second-admin@example.com'))$$,
  'P0001',
  'Sign in with the invited email to accept.',
  'token with the wrong account does not claim'
);

select is_empty(
  $$select * from admin_invites$$,
  'unrelated user does not see pending invites'
);

select set_config('request.jwt.claim.sub', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}',
  true
);

select throws_ok(
  $$insert into admin_invites (organization_id, email, role)
    select id, 'another@example.com', 'instructor' from organizations$$,
  '42501',
  'Only owners and admins can invite collaborators.',
  'instructor cannot invite collaborators'
);

select * from finish();
rollback;
