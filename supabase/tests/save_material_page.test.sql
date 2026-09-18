-- save_material_page writes one version only when saved content actually changed.
begin;
select plan(5);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'cccc3333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated', 'save-admin@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Save Admin"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'dddd4444-4444-4444-4444-444444444444',
    'authenticated', 'authenticated', 'save-parent@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Save Parent"}'::jsonb,
    now(), now()
  );

insert into organizations (name, org_type, grade_scheme)
values ('Save Co-op', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, 'cccc3333-3333-3333-3333-333333333333', 'owner', 'active'
from organizations
where name = 'Save Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'dddd4444-4444-4444-4444-444444444444', 'parent', 'active'
from organizations
where name = 'Save Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Writing', 'active', 'published'
from organizations
where name = 'Save Co-op';

insert into materials (
  organization_id, course_id, title, description, kind, visibility
)
select o.id, c.id, 'Lesson one', '', 'page', 'unpublished'
from organizations o
join courses c on c.organization_id = o.id
where o.name = 'Save Co-op';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccc3333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"cccc3333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select is(
  (
    select current_version from materials
    where title = 'Lesson one'
  ),
  1,
  'create stores version 1'
);

select is(
  public.save_material_page(
    (select id from materials where title = 'Lesson one'),
    null,
    '[{"kind":"rich_text","body":{"markdown":"Hello"},"position":0}]'::jsonb
  ),
  2,
  'first content save creates version 2'
);

select is(
  public.save_material_page(
    (select id from materials where title = 'Lesson one'),
    null,
    '[{"kind":"rich_text","body":{"markdown":"Hello"},"position":0}]'::jsonb
  ),
  2,
  'saving unchanged content does not create a version'
);

select is(
  public.save_material_page(
    (select id from materials where title = 'Lesson one'),
    '{"title":"Lesson one revised","description":"","url":null,"scheduled_date":null}'::jsonb,
    '[{"kind":"rich_text","body":{"markdown":"Hello again"},"position":0}]'::jsonb
  ),
  3,
  'one save with title and content changes creates one version'
);

reset role;
select set_config(
  'cw.test_material_id',
  (select id::text from materials where title = 'Lesson one revised'),
  true
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddd4444-4444-4444-4444-444444444444', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"dddd4444-4444-4444-4444-444444444444","role":"authenticated"}',
  true
);

select throws_ok(
  format(
    $sql$select public.save_material_page(
      %s,
      '{"title":"Hacked","description":"","url":null,"scheduled_date":null}'::jsonb,
      null
    )$sql$,
    current_setting('cw.test_material_id')
  ),
  '42501',
  'You can’t edit this material.',
  'parents cannot save materials they do not manage'
);

select * from finish();
rollback;
