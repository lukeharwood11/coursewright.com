# AGENTS — `src/quizzes/`

Course **Quiz**: an outline item families take in the app or print. Not a material kind, and not a page quiz block.

## Scope

- Quizzes sit on a unit, ordered with materials by `position` (a material wins a tie).
- New quizzes start **unpublished**. Families see one only when the course is active and published, the quiz is published, and their student is enrolled.
- Optional accepting window (`accepts_from` / `accepts_until`). Neither set → print only. One or both set → Submit only while now is inside the bounds that are set.
- **Allow more than one attempt** (default off). **Grade questions automatically and show the score right away** (default off) covers multiple choice, number, and matching. **Share answer key with parents** (default off).
- Kinds: multiple choice, short answer, number, matching, long answer. A long answer has a line count (1–20). Short answer and long answer are not scored.
- Answer keys live in `quiz_answer_keys`. Matching links live in `quiz_match_keys` (prompts and options are separate rows families can read). A student login (account email matches that student’s `student_email`) never sees the key. Staff Teacher view always does.
- Attempts are `quiz_attempts`, not `material_submissions`. Submit goes through `submit_quiz_attempt`.

## Rules

- Page quiz blocks in `src/materials/` stay a printable side element. Do not turn those nodes into this quiz.
- Do not store quiz answers on `material_submissions`.
- The database enforces the window, the attempt limit, and who can read the key. The browser copy is not the lock.
- No drafts. Nothing is stored until Submit.
- Short answers are stored and shown to the teacher. They are not part of the automatic score.
- Course-from-course copies quizzes, questions, choices, keys, and matching prompts, options, and keys. It does not copy attempts.

## Don’t

- Add a quiz material kind.
- Put quizzes on course templates in this slice.
- Add manual points, a max-attempt count, Activity, or a gradebook here.
