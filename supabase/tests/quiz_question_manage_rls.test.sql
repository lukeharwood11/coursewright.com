-- Adding a quiz question must succeed for anyone who can manage the course,
-- including when quizzes_select would hide the parent quiz.
begin;
select plan(24);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'a7111111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'quiz-manage-owner@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Quiz Owner"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a7222222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated', 'quiz-manage-admin@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Quiz Admin"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a7333333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated', 'quiz-manage-assigned@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Assigned Instructor"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a7444444-4444-4444-4444-444444444444',
    'authenticated', 'authenticated', 'quiz-manage-unassigned@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Unassigned Instructor"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a7555555-5555-5555-5555-555555555555',
    'authenticated', 'authenticated', 'quiz-manage-parent@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Quiz Parent"}'::jsonb,
    now(), now()
  );

insert into organizations (name, org_type, grade_scheme)
values ('Quiz Manage Co-op', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, 'a7111111-1111-1111-1111-111111111111', 'owner', 'active'
from organizations where name = 'Quiz Manage Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'a7222222-2222-2222-2222-222222222222', 'admin', 'active'
from organizations where name = 'Quiz Manage Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'a7333333-3333-3333-3333-333333333333', 'instructor', 'active'
from organizations where name = 'Quiz Manage Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'a7444444-4444-4444-4444-444444444444', 'instructor', 'active'
from organizations where name = 'Quiz Manage Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'a7555555-5555-5555-5555-555555555555', 'parent', 'active'
from organizations where name = 'Quiz Manage Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Manage quiz course', 'active', 'published'
from organizations where name = 'Quiz Manage Co-op';

insert into course_instructors (course_id, user_id)
select c.id, 'a7333333-3333-3333-3333-333333333333'
from courses c
where c.title = 'Manage quiz course';

insert into quizzes (
  organization_id, course_id, title, visibility, created_by
)
select o.id, c.id, 'Unpublished manage quiz', 'unpublished',
  'a7111111-1111-1111-1111-111111111111'
from organizations o
join courses c on c.organization_id = o.id
where o.name = 'Quiz Manage Co-op';

insert into quizzes (
  organization_id, course_id, title, visibility, created_by
)
select o.id, c.id, 'Published manage quiz', 'published',
  'a7111111-1111-1111-1111-111111111111'
from organizations o
join courses c on c.organization_id = o.id
where o.name = 'Quiz Manage Co-op';

-- Literal ids, the way PostgREST sends quiz_id. Do not look the quiz up
-- under the caller's quizzes_select inside the insert. A real table (rolled
-- back with this test) stays readable after set role authenticated.
create table public.quiz_manage_ids (
  course_id bigint,
  unpublished_id bigint,
  published_id bigint
);
insert into public.quiz_manage_ids (course_id, unpublished_id, published_id)
select
  (select id from courses where title = 'Manage quiz course'),
  (select id from quizzes where title = 'Unpublished manage quiz'),
  (select id from quizzes where title = 'Published manage quiz');
grant select on public.quiz_manage_ids to authenticated;

select is_empty(
  $$
    select 1
    from course_instructors ci
    join courses c on c.id = ci.course_id
    where c.title = 'Manage quiz course'
      and ci.user_id in (
        'a7111111-1111-1111-1111-111111111111',
        'a7222222-2222-2222-2222-222222222222',
        'a7444444-4444-4444-4444-444444444444'
      )
  $$,
  'owner, admin, and unassigned instructor have no course_instructors row'
);

select isnt_empty(
  $$
    select 1
    from course_instructors ci
    join courses c on c.id = ci.course_id
    where c.title = 'Manage quiz course'
      and ci.user_id = 'a7333333-3333-3333-3333-333333333333'
  $$,
  'assigned instructor has a course_instructors row'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a7111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a7111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select results_eq(
  $$select private.can_manage_course(course_id) from quiz_manage_ids$$,
  array[true],
  'owner can manage the course without a course_instructors row'
);

select results_eq(
  $$
    insert into quiz_questions (quiz_id, position, prompt, kind)
    select unpublished_id, 0, 'Owner unpublished', 'short_answer'
    from quiz_manage_ids
    returning prompt
  $$,
  array['Owner unpublished'::text],
  'owner inserts a question on an unpublished quiz and reads it back'
);

select results_eq(
  $$
    insert into quiz_questions (quiz_id, position, prompt, kind)
    select published_id, 0, 'Owner published', 'short_answer'
    from quiz_manage_ids
    returning prompt
  $$,
  array['Owner published'::text],
  'owner inserts a question on a published quiz and reads it back'
);

select results_eq(
  $$
    update quiz_questions
    set prompt = 'Owner unpublished edited'
    where prompt = 'Owner unpublished'
    returning prompt
  $$,
  array['Owner unpublished edited'::text],
  'owner updates a question and reads it back'
);

select results_eq(
  $$
    insert into quiz_choices (question_id, position, text)
    select id, 0, 'Yes'
    from quiz_questions
    where prompt = 'Owner unpublished edited'
    returning text
  $$,
  array['Yes'::text],
  'owner inserts a choice and reads it back'
);

select results_eq(
  $$
    insert into quiz_answer_keys (question_id, answer_text)
    select id, 'Yes'
    from quiz_questions
    where prompt = 'Owner unpublished edited'
    returning answer_text
  $$,
  array['Yes'::text],
  'owner inserts an answer key and reads it back'
);

select results_eq(
  $$
    insert into quiz_match_prompts (question_id, position, text)
    select id, 0, 'Left'
    from quiz_questions
    where prompt = 'Owner unpublished edited'
    returning text
  $$,
  array['Left'::text],
  'owner inserts a matching prompt and reads it back'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a7222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a7222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select results_eq(
  $$select private.can_manage_course(course_id) from quiz_manage_ids$$,
  array[true],
  'admin can manage the course without a course_instructors row'
);

select results_eq(
  $$
    insert into quiz_questions (quiz_id, position, prompt, kind)
    select unpublished_id, 1, 'Admin unpublished', 'short_answer'
    from quiz_manage_ids
    returning prompt
  $$,
  array['Admin unpublished'::text],
  'admin inserts a question on an unpublished quiz and reads it back'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a7333333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a7333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select results_eq(
  $$select private.can_manage_course(course_id) from quiz_manage_ids$$,
  array[true],
  'assigned instructor can manage the course'
);

select results_eq(
  $$
    insert into quiz_questions (quiz_id, position, prompt, kind)
    select unpublished_id, 2, 'Assigned unpublished', 'short_answer'
    from quiz_manage_ids
    returning prompt
  $$,
  array['Assigned unpublished'::text],
  'assigned instructor inserts a question and reads it back'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a7444444-4444-4444-4444-444444444444', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a7444444-4444-4444-4444-444444444444","role":"authenticated"}',
  true
);

select results_eq(
  $$select private.can_manage_course(course_id) from quiz_manage_ids$$,
  array[false],
  'org instructor without a course_instructors row cannot manage the course'
);

select results_eq(
  $$select title from quizzes where title = 'Unpublished manage quiz'$$,
  array['Unpublished manage quiz'::text],
  'org instructor without an assignment can still read the unpublished quiz'
);

select throws_ok(
  $$
    insert into quiz_questions (quiz_id, position, prompt, kind)
    select unpublished_id, 3, 'Unassigned denied', 'short_answer'
    from quiz_manage_ids
    returning prompt
  $$,
  '42501',
  'new row violates row-level security policy for table "quiz_questions"',
  'org instructor without a course assignment cannot add a question'
);

select is_empty(
  $$select 1 from quiz_questions where prompt = 'Unassigned denied'$$,
  'denied question insert did not leave a row'
);

select is_empty(
  $$
    update quiz_questions
    set prompt = 'Stolen'
    where prompt = 'Owner unpublished edited'
    returning prompt
  $$,
  'org instructor without a course assignment cannot update a question'
);

select results_eq(
  $$select prompt from quiz_questions where prompt = 'Owner unpublished edited'$$,
  array['Owner unpublished edited'::text],
  'denied update left the question unchanged'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a7555555-5555-5555-5555-555555555555', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a7555555-5555-5555-5555-555555555555","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    insert into quiz_questions (quiz_id, position, prompt, kind)
    select unpublished_id, 4, 'Parent denied', 'short_answer'
    from quiz_manage_ids
    returning prompt
  $$,
  '42501',
  'new row violates row-level security policy for table "quiz_questions"',
  'parent cannot add a question'
);

-- Nested quizzes_select must not be what allows the write. Deny every
-- quizzes read, then insert with a literal quiz id the way the editor does.
reset role;
drop policy quizzes_select on public.quizzes;
create policy quizzes_select on public.quizzes
for select to authenticated
using (false);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a7111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a7111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select results_eq(
  $$
    insert into quiz_questions (quiz_id, position, prompt, kind)
    select unpublished_id, 5, 'Hidden parent select', 'short_answer'
    from quiz_manage_ids
    returning prompt
  $$,
  array['Hidden parent select'::text],
  'owner inserts a question when quizzes_select hides the parent quiz'
);

select results_eq(
  $$
    insert into quiz_choices (question_id, position, text)
    select id, 0, 'Still yes'
    from quiz_questions
    where prompt = 'Hidden parent select'
    returning text
  $$,
  array['Still yes'::text],
  'owner inserts a choice when quizzes_select hides the parent quiz'
);

select results_eq(
  $$
    insert into quiz_answer_keys (question_id, answer_text)
    select id, 'Still yes'
    from quiz_questions
    where prompt = 'Hidden parent select'
    returning answer_text
  $$,
  array['Still yes'::text],
  'owner inserts an answer key when quizzes_select hides the parent quiz'
);

select results_eq(
  $$
    insert into quiz_match_options (question_id, position, text)
    select id, 0, 'Right'
    from quiz_questions
    where prompt = 'Hidden parent select'
    returning text
  $$,
  array['Right'::text],
  'owner inserts a matching option when quizzes_select hides the parent quiz'
);

select * from finish();
rollback;
