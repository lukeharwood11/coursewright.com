-- Discussions RLS: parent INSERT … RETURNING (Start discussion), staff create,
-- parent/staff reply. Enrollment and class-membership gates stay in place.
begin;
select plan(14);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'd1111111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'disc-owner@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Disc Owner"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'd2222222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated', 'disc-parent@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Disc Parent"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'd3333333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated', 'disc-outsider@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Disc Outsider"}'::jsonb,
    now(), now()
  );

insert into organizations (name, org_type, grade_scheme)
values ('Discussion RLS Co-op', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, 'd1111111-1111-1111-1111-111111111111', 'owner', 'active'
from organizations
where name = 'Discussion RLS Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'd2222222-2222-2222-2222-222222222222', 'parent', 'active'
from organizations
where name = 'Discussion RLS Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Published math', 'active', 'published'
from organizations
where name = 'Discussion RLS Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Other published', 'active', 'published'
from organizations
where name = 'Discussion RLS Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Unpublished science', 'active', 'unpublished'
from organizations
where name = 'Discussion RLS Co-op';

insert into classes (organization_id, title)
select id, 'Thursday cohort'
from organizations
where name = 'Discussion RLS Co-op';

insert into classes (organization_id, title)
select id, 'Friday cohort'
from organizations
where name = 'Discussion RLS Co-op';

insert into student_profiles (organization_id, name)
select id, 'Kid Discuss'
from organizations
where name = 'Discussion RLS Co-op';

insert into enrollments (student_profile_id, course_id, status)
select sp.id, c.id, 'active'
from student_profiles sp
join courses c on c.organization_id = sp.organization_id
where sp.name = 'Kid Discuss' and c.title = 'Published math';

insert into class_members (class_id, student_profile_id)
select cl.id, sp.id
from classes cl
join student_profiles sp on sp.organization_id = cl.organization_id
where cl.title = 'Thursday cohort' and sp.name = 'Kid Discuss';

insert into parent_student_links (parent_user_id, student_profile_id)
select 'd2222222-2222-2222-2222-222222222222', id
from student_profiles
where name = 'Kid Discuss';

-- Staff-created threads the parent should / should not see.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select results_eq(
  $$
    insert into discussions (
      organization_id, audience, course_id, class_id, title, created_by
    )
    select o.id, 'course', c.id, null, 'Staff math thread',
      'd1111111-1111-1111-1111-111111111111'
    from organizations o
    join courses c on c.organization_id = o.id
    where o.name = 'Discussion RLS Co-op' and c.title = 'Published math'
    returning title
  $$,
  array['Staff math thread'::text],
  'staff INSERT RETURNING creates a course discussion'
);

select lives_ok(
  $$
    insert into discussion_messages (discussion_id, author_id, body)
    select d.id, 'd1111111-1111-1111-1111-111111111111', 'Welcome families.'
    from discussions d
    where d.title = 'Staff math thread'
    returning id
  $$,
  'staff can post the opening message with RETURNING'
);

insert into discussions (
  organization_id, audience, course_id, class_id, title, created_by
)
select o.id, 'course', c.id, null, 'Staff other-course thread',
  'd1111111-1111-1111-1111-111111111111'
from organizations o
join courses c on c.organization_id = o.id
where o.name = 'Discussion RLS Co-op' and c.title = 'Other published';

-- Parent Start discussion (the failing PostgREST path).
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd2222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"d2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select results_eq(
  $$
    insert into discussions (
      organization_id, audience, course_id, class_id, title, created_by
    )
    select o.id, 'course', c.id, null, 'Parent homework question',
      'd2222222-2222-2222-2222-222222222222'
    from organizations o
    join courses c on c.organization_id = o.id
    where o.name = 'Discussion RLS Co-op' and c.title = 'Published math'
    returning title
  $$,
  array['Parent homework question'::text],
  'enrolled parent INSERT RETURNING starts a course discussion'
);

select results_eq(
  $$
    insert into discussions (
      organization_id, audience, course_id, class_id, title, created_by
    )
    select o.id, 'class', null, cl.id, 'Parent class question',
      'd2222222-2222-2222-2222-222222222222'
    from organizations o
    join classes cl on cl.organization_id = o.id
    where o.name = 'Discussion RLS Co-op' and cl.title = 'Thursday cohort'
    returning title
  $$,
  array['Parent class question'::text],
  'class-member parent INSERT RETURNING starts a class discussion'
);

select lives_ok(
  $$
    insert into discussion_messages (discussion_id, author_id, body)
    select d.id, 'd2222222-2222-2222-2222-222222222222', 'Here is the question.'
    from discussions d
    where d.title = 'Parent homework question'
    returning id
  $$,
  'parent can post the opening message with RETURNING'
);

select lives_ok(
  $$
    insert into discussion_messages (discussion_id, author_id, body)
    select d.id, 'd2222222-2222-2222-2222-222222222222', 'Class question body.'
    from discussions d
    where d.title = 'Parent class question'
    returning id
  $$,
  'parent can post on their class discussion with RETURNING'
);

select lives_ok(
  $$
    insert into discussion_messages (discussion_id, author_id, body)
    select d.id, 'd2222222-2222-2222-2222-222222222222', 'Thanks for starting this.'
    from discussions d
    where d.title = 'Staff math thread'
    returning id
  $$,
  'parent can reply on a staff course thread they can see'
);

select results_eq(
  $$select title from discussions where title = 'Staff math thread'$$,
  array['Staff math thread'::text],
  'enrolled parent can SELECT a staff course discussion'
);

select is_empty(
  $$select * from discussions where title = 'Staff other-course thread'$$,
  'parent cannot SELECT a discussion for a course they are not enrolled in'
);

select throws_ok(
  $$
    insert into discussions (
      organization_id, audience, course_id, class_id, title, created_by
    )
    select o.id, 'course', c.id, null, 'Sneaky unpublished',
      'd2222222-2222-2222-2222-222222222222'
    from organizations o
    join courses c on c.organization_id = o.id
    where o.name = 'Discussion RLS Co-op' and c.title = 'Unpublished science'
    returning title
  $$,
  '42501',
  NULL,
  'parent cannot start a discussion on an unpublished course'
);

select throws_ok(
  $$
    insert into discussions (
      organization_id, audience, course_id, class_id, title, created_by
    )
    select o.id, 'course', c.id, null, 'Sneaky other course',
      'd2222222-2222-2222-2222-222222222222'
    from organizations o
    join courses c on c.organization_id = o.id
    where o.name = 'Discussion RLS Co-op' and c.title = 'Other published'
    returning title
  $$,
  '42501',
  NULL,
  'parent cannot start a discussion on a course they are not enrolled in'
);

select throws_ok(
  $$
    insert into discussions (
      organization_id, audience, course_id, class_id, title, created_by
    )
    select o.id, 'class', null, cl.id, 'Sneaky other class',
      'd2222222-2222-2222-2222-222222222222'
    from organizations o
    join classes cl on cl.organization_id = o.id
    where o.name = 'Discussion RLS Co-op' and cl.title = 'Friday cohort'
    returning title
  $$,
  '42501',
  NULL,
  'parent cannot start a discussion on a class their child is not in'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd3333333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"d3333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from discussions$$,
  'unrelated user sees no discussions'
);

select throws_ok(
  $$
    insert into discussions (
      organization_id, audience, course_id, class_id, title, created_by
    )
    select o.id, 'course', c.id, null, 'Outsider thread',
      'd3333333-3333-3333-3333-333333333333'
    from organizations o
    join courses c on c.organization_id = o.id
    where o.name = 'Discussion RLS Co-op' and c.title = 'Published math'
    returning title
  $$,
  '42501',
  NULL,
  'unrelated user cannot start a discussion'
);

select * from finish();
rollback;
