-- Bulletins: staff manage; enrolled parents read non-deleted rows on viewable courses.
begin;
select plan(6);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'cccc3333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated', 'bulletin-admin@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Bulletin Admin"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'dddd4444-4444-4444-4444-444444444444',
    'authenticated', 'authenticated', 'bulletin-parent@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Bulletin Parent"}'::jsonb,
    now(), now()
  );

insert into organizations (name, org_type, grade_scheme)
values ('Bulletin Co-op', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, 'cccc3333-3333-3333-3333-333333333333', 'owner', 'active'
from organizations
where name = 'Bulletin Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'dddd4444-4444-4444-4444-444444444444', 'parent', 'active'
from organizations
where name = 'Bulletin Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Science', 'active', 'published'
from organizations
where name = 'Bulletin Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Art', 'active', 'published'
from organizations
where name = 'Bulletin Co-op';

insert into student_profiles (organization_id, name)
select id, 'Kid Bulletin'
from organizations
where name = 'Bulletin Co-op';

insert into enrollments (student_profile_id, course_id, status)
select sp.id, c.id, 'active'
from student_profiles sp
join courses c on c.organization_id = sp.organization_id
where sp.name = 'Kid Bulletin' and c.title = 'Science';

insert into parent_student_links (parent_user_id, student_profile_id)
select 'dddd4444-4444-4444-4444-444444444444', id
from student_profiles
where name = 'Kid Bulletin';

insert into materials (organization_id, course_id, title, description, kind, visibility)
select o.id, c.id, 'Lab packet', '', 'page', 'published'
from organizations o
join courses c on c.organization_id = o.id
where o.name = 'Bulletin Co-op' and c.title = 'Science';

insert into materials (organization_id, course_id, title, description, kind, visibility)
select o.id, c.id, 'Paint study', '', 'page', 'published'
from organizations o
join courses c on c.organization_id = o.id
where o.name = 'Bulletin Co-op' and c.title = 'Art';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccc3333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"cccc3333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    insert into bulletins (
      organization_id, course_id, title, body, start_date, end_date, created_by
    )
    select o.id, c.id, 'Week 3', 'Start with the lab.', '2026-09-13', '2026-09-19',
      'cccc3333-3333-3333-3333-333333333333'
    from organizations o
    join courses c on c.organization_id = o.id
    where o.name = 'Bulletin Co-op' and c.title = 'Science'
  $$,
  'owner can create a bulletin on a course they manage'
);

select lives_ok(
  $$
    insert into bulletin_materials (bulletin_id, material_id, position)
    select b.id, m.id, 0
    from bulletins b
    join materials m on m.course_id = b.course_id
    where b.title = 'Week 3' and m.title = 'Lab packet'
  $$,
  'owner can attach a same-course material'
);

select throws_ok(
  $$
    insert into bulletin_materials (bulletin_id, material_id, position)
    select b.id, m.id, 1
    from bulletins b
    join materials m on m.title = 'Paint study'
    where b.title = 'Week 3'
  $$,
  '23514',
  'Those materials need to be in the same course as this bulletin.',
  'cannot attach a material from another course'
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
  $$select title from bulletins where title = 'Week 3'$$,
  array['Week 3'::text],
  'enrolled parent can read a non-deleted bulletin on a published course'
);

select throws_ok(
  $$
    insert into bulletins (
      organization_id, course_id, title, body, start_date, end_date, created_by
    )
    select o.id, c.id, 'Sneaky', '', '2026-09-13', '2026-09-19',
      'dddd4444-4444-4444-4444-444444444444'
    from organizations o
    join courses c on c.organization_id = o.id
    where o.name = 'Bulletin Co-op' and c.title = 'Science'
  $$,
  '42501',
  'parent cannot create a bulletin'
);

reset role;
update bulletins set deleted_at = now() where title = 'Week 3';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddd4444-4444-4444-4444-444444444444', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"dddd4444-4444-4444-4444-444444444444","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from bulletins where title = 'Week 3'$$,
  'parent cannot read a soft-deleted bulletin'
);

select * from finish();
rollback;
