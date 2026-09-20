-- Lesson plans: staff manage; enrolled parents read published non-deleted rows.
begin;
select plan(8);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'cccc3333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated', 'plan-admin@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Plan Admin"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'dddd4444-4444-4444-4444-444444444444',
    'authenticated', 'authenticated', 'plan-parent@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Plan Parent"}'::jsonb,
    now(), now()
  );

insert into organizations (name, org_type, grade_scheme)
values ('Plan Co-op', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, 'cccc3333-3333-3333-3333-333333333333', 'owner', 'active'
from organizations
where name = 'Plan Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'dddd4444-4444-4444-4444-444444444444', 'parent', 'active'
from organizations
where name = 'Plan Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Science', 'active', 'published'
from organizations
where name = 'Plan Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Art', 'active', 'published'
from organizations
where name = 'Plan Co-op';

insert into student_profiles (organization_id, name)
select id, 'Kid Plan'
from organizations
where name = 'Plan Co-op';

insert into enrollments (student_profile_id, course_id, status)
select sp.id, c.id, 'active'
from student_profiles sp
join courses c on c.organization_id = sp.organization_id
where sp.name = 'Kid Plan' and c.title = 'Science';

insert into parent_student_links (parent_user_id, student_profile_id)
select 'dddd4444-4444-4444-4444-444444444444', id
from student_profiles
where name = 'Kid Plan';

insert into materials (organization_id, course_id, title, description, kind, visibility)
select o.id, c.id, 'Lab packet', '', 'page', 'published'
from organizations o
join courses c on c.organization_id = o.id
where o.name = 'Plan Co-op' and c.title = 'Science';

insert into materials (organization_id, course_id, title, description, kind, visibility)
select o.id, c.id, 'Paint study', '', 'page', 'published'
from organizations o
join courses c on c.organization_id = o.id
where o.name = 'Plan Co-op' and c.title = 'Art';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccc3333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"cccc3333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    insert into lesson_plans (
      organization_id, course_id, week_start, title, week_note, visibility, created_by
    )
    select o.id, c.id, '2026-09-13', 'Week 3', 'Start with the lab.', 'published',
      'cccc3333-3333-3333-3333-333333333333'
    from organizations o
    join courses c on c.organization_id = o.id
    where o.name = 'Plan Co-op' and c.title = 'Science'
  $$,
  'owner can create a lesson plan on a course they manage'
);

select lives_ok(
  $$
    insert into lesson_plan_days (lesson_plan_id, day_date, body)
    select lp.id, '2026-09-14', 'Monday lab'
    from lesson_plans lp
    where lp.title = 'Week 3'
  $$,
  'owner can add a day in that week'
);

select lives_ok(
  $$
    insert into lesson_plan_day_materials (lesson_plan_day_id, material_id, position)
    select d.id, m.id, 0
    from lesson_plan_days d
    join lesson_plans lp on lp.id = d.lesson_plan_id
    join materials m on m.course_id = lp.course_id
    where lp.title = 'Week 3' and m.title = 'Lab packet'
  $$,
  'owner can attach a same-course material'
);

select throws_ok(
  $$
    insert into lesson_plan_day_materials (lesson_plan_day_id, material_id, position)
    select d.id, m.id, 1
    from lesson_plan_days d
    join lesson_plans lp on lp.id = d.lesson_plan_id
    join materials m on m.title = 'Paint study'
    where lp.title = 'Week 3'
  $$,
  '23514',
  'Those materials need to be in the same course as this lesson plan.',
  'cannot attach a material from another course'
);

select throws_ok(
  $$
    insert into lesson_plans (
      organization_id, course_id, week_start, title, week_note, visibility, created_by
    )
    select o.id, c.id, '2026-09-13', 'Duplicate week', '', 'unpublished',
      'cccc3333-3333-3333-3333-333333333333'
    from organizations o
    join courses c on c.organization_id = o.id
    where o.name = 'Plan Co-op' and c.title = 'Science'
  $$,
  '23505',
  'one published or draft plan per course per week'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddd4444-4444-4444-4444-444444444444', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"dddd4444-4444-4444-4444-444444444444","role":"authenticated"}',
  true
);

select results_eq(
  $$select title from lesson_plans where title = 'Week 3'$$,
  array['Week 3'::text],
  'enrolled parent can read a published lesson plan on a published course'
);

select throws_ok(
  $$
    insert into lesson_plans (
      organization_id, course_id, week_start, title, week_note, visibility, created_by
    )
    select o.id, c.id, '2026-09-20', 'Sneaky', '', 'published',
      'dddd4444-4444-4444-4444-444444444444'
    from organizations o
    join courses c on c.organization_id = o.id
    where o.name = 'Plan Co-op' and c.title = 'Science'
  $$,
  '42501',
  'parent cannot create a lesson plan'
);

reset role;
update lesson_plans set visibility = 'unpublished' where title = 'Week 3';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddd4444-4444-4444-4444-444444444444', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"dddd4444-4444-4444-4444-444444444444","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from lesson_plans where title = 'Week 3'$$,
  'parent cannot read an unpublished lesson plan'
);

select * from finish();
rollback;
