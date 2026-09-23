-- Course quizzes: families see published quizzes, students never see the key,
-- and submit_quiz_attempt enforces the window and attempt limit.
begin;
select plan(12);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'c1111111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'quiz-admin@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Quiz Admin"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'c2222222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated', 'quiz-parent@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Quiz Parent"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'c3333333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated', 'quiz-student@example.com',
    extensions.crypt('pass', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Quiz Student"}'::jsonb,
    now(), now()
  );

insert into organizations (name, org_type, grade_scheme)
values ('Quiz Co-op', 'coop', 'k12');

insert into memberships (organization_id, user_id, role, status)
select id, 'c1111111-1111-1111-1111-111111111111', 'owner', 'active'
from organizations where name = 'Quiz Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'c2222222-2222-2222-2222-222222222222', 'parent', 'active'
from organizations where name = 'Quiz Co-op';

insert into memberships (organization_id, user_id, role, status)
select id, 'c3333333-3333-3333-3333-333333333333', 'parent', 'active'
from organizations where name = 'Quiz Co-op';

insert into courses (organization_id, title, status, visibility)
select id, 'Quiz course', 'active', 'published'
from organizations where name = 'Quiz Co-op';

insert into student_profiles (organization_id, name, student_email)
select id, 'Ava Quiz', 'quiz-student@example.com'
from organizations where name = 'Quiz Co-op';

insert into enrollments (student_profile_id, course_id, status)
select sp.id, c.id, 'active'
from student_profiles sp
join courses c on c.organization_id = sp.organization_id
where sp.name = 'Ava Quiz';

insert into parent_student_links (parent_user_id, student_profile_id)
select parent_id, sp.id
from student_profiles sp
cross join (
  values
    ('c2222222-2222-2222-2222-222222222222'::uuid),
    ('c3333333-3333-3333-3333-333333333333'::uuid)
) as parents(parent_id)
where sp.name = 'Ava Quiz';

insert into quizzes (
  organization_id, course_id, title, visibility, created_by
)
select o.id, c.id, 'Hidden quiz', 'unpublished', 'c1111111-1111-1111-1111-111111111111'
from organizations o
join courses c on c.organization_id = o.id
where o.name = 'Quiz Co-op';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c1111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c1111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select results_eq(
  $$select title from quizzes where title = 'Hidden quiz'$$,
  array['Hidden quiz'::text],
  'staff can read an unpublished quiz'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from quizzes where title = 'Hidden quiz'$$,
  'parent cannot read an unpublished quiz'
);

reset role;
update quizzes set visibility = 'published' where title = 'Hidden quiz';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select results_eq(
  $$select title from quizzes where title = 'Hidden quiz'$$,
  array['Hidden quiz'::text],
  'parent can read a published quiz on an active enrolled course'
);

reset role;

insert into quiz_questions (quiz_id, position, prompt, kind)
select id, 0, 'Capital?', 'multiple_choice'
from quizzes where title = 'Hidden quiz';

insert into quiz_choices (question_id, position, text)
select id, 0, 'Paris' from quiz_questions where prompt = 'Capital?';
insert into quiz_choices (question_id, position, text)
select id, 1, 'Lyon' from quiz_questions where prompt = 'Capital?';

insert into quiz_answer_keys (question_id, choice_id)
select q.id, c.id
from quiz_questions q
join quiz_choices c on c.question_id = q.id
where q.prompt = 'Capital?' and c.text = 'Paris';

update quizzes
set share_answer_key_with_parents = false
where title = 'Hidden quiz';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from quiz_answer_keys$$,
  'parent cannot read the answer key when sharing is off'
);

reset role;
update quizzes
set share_answer_key_with_parents = true
where title = 'Hidden quiz';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select isnt_empty(
  $$select * from quiz_answer_keys$$,
  'parent can read the answer key when sharing is on'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c3333333-3333-3333-3333-333333333333', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c3333333-3333-3333-3333-333333333333","role":"authenticated"}',
  true
);

select is_empty(
  $$select * from quiz_answer_keys$$,
  'a student login cannot read the answer key'
);

reset role;
update quizzes
set accepts_from = null, accepts_until = null, autograde_and_show = true
where title = 'Hidden quiz';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    select public.submit_quiz_attempt(
      (select id from quizzes where title = 'Hidden quiz'),
      (select id from student_profiles where name = 'Ava Quiz'),
      '[]'::jsonb
    )
  $$,
  'P0001',
  'This quiz is for printing, not turning in here.',
  'submit is rejected when no accepting window is set'
);

reset role;
update quizzes
set accepts_from = now() + interval '1 day'
where title = 'Hidden quiz';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    select public.submit_quiz_attempt(
      (select id from quizzes where title = 'Hidden quiz'),
      (select id from student_profiles where name = 'Ava Quiz'),
      '[]'::jsonb
    )
  $$,
  'P0001',
  'This quiz is not accepting entries yet.',
  'submit is rejected before the window opens'
);

reset role;
update quizzes
set accepts_from = now() - interval '2 days',
    accepts_until = now()
where title = 'Hidden quiz';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    select public.submit_quiz_attempt(
      (select id from quizzes where title = 'Hidden quiz'),
      (select id from student_profiles where name = 'Ava Quiz'),
      '[]'::jsonb
    )
  $$,
  'P0001',
  'This quiz is no longer accepting entries.',
  'submit is rejected at the end of the window'
);

reset role;
update quizzes
set accepts_from = now() - interval '1 day',
    accepts_until = now() + interval '1 day',
    allow_multiple_attempts = false,
    autograde_and_show = true
where title = 'Hidden quiz';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select is(
  (
    select public.submit_quiz_attempt(
      (select id from quizzes where title = 'Hidden quiz'),
      (select id from student_profiles where name = 'Ava Quiz'),
      jsonb_build_array(
        jsonb_build_object(
          'questionId', (select id from quiz_questions where prompt = 'Capital?'),
          'choiceIds', jsonb_build_array(
            (select c.id from quiz_choices c
             join quiz_questions q on q.id = c.question_id
             where q.prompt = 'Capital?' and c.text = 'Paris')
          ),
          'text', ''
        )
      )
    ) ->> 'score'
  ),
  '1',
  'a correct multiple-choice answer scores when autograde is on'
);

select throws_ok(
  $$
    select public.submit_quiz_attempt(
      (select id from quizzes where title = 'Hidden quiz'),
      (select id from student_profiles where name = 'Ava Quiz'),
      '[]'::jsonb
    )
  $$,
  'P0001',
  'This quiz already has an entry for that student.',
  'a second entry is rejected when multiple attempts are off'
);

reset role;
insert into quizzes (
  organization_id, course_id, title, visibility, created_by,
  accepts_from, accepts_until, autograde_and_show, share_answer_key_with_parents
)
select o.id, c.id, 'Unscored quiz', 'published', 'c1111111-1111-1111-1111-111111111111',
  now() - interval '1 hour', now() + interval '1 hour', false, false
from organizations o
join courses c on c.organization_id = o.id
where o.name = 'Quiz Co-op';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

select ok(
  (
    select public.submit_quiz_attempt(
      (select id from quizzes where title = 'Unscored quiz'),
      (select id from student_profiles where name = 'Ava Quiz'),
      '[]'::jsonb
    ) ->> 'score'
  ) is null,
  'an entry stores no score when autograde is off'
);

select * from finish();
rollback;
