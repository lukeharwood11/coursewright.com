# AGENTS — `src/submissions/`

Students (and linked parents on their behalf) submit files on a course material that **accepts submissions**.

## Scope

- One slot per enrolled student. The student account or any linked parent uploads into that slot.
- The teacher sets how many submissions are allowed (1–10, default 2) and which file groups are allowed.
- One submission is one or more files submitted together. They share one timestamp and one line: **"<Parent name> on behalf of <child name>"** (or just the student name when they submit themselves).
- A later submit is a new submission. Files already submitted stay.
- **Allow submissions past due date** defaults on. When off, submit stops after `due_at`.
- Material view shows a **right side panel** (Submit / Submissions) with allowed file kinds listed.

## Rules

- Actors are the student (`student_profiles.user_id`) or a parent linked to that profile.
- Do not treat a submission file as a handout. Only the linked family and course staff can read it.
- Submit uses `begin_material_submission` / `finish_material_submission`. Do not open general family file upload.
- This is not a quiz Submission and not a separate assignment object.
- Family primary action copy is **Submit** (upload icon), not “Turn in”.

## Don’t

- Add a Late badge here. Grades and feedback are the material grading walkthrough (`grade_material_submission`), not a second score table.
- Let a family append files to a submission after it is submitted.
- Copy submitted files when copying a course.
