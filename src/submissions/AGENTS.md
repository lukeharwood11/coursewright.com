# AGENTS — `src/submissions/`

Families turn in files on a course material that **accepts submissions**.

## Scope

- One slot per enrolled student. Any linked parent uploads into that slot.
- The teacher sets how many submissions are allowed (1–10, default 2) and which file groups are allowed.
- One submission is one or more files turned in together. They share one timestamp and one line: **"<Parent name> on behalf of <child name>"**.
- A later turn-in is a new submission. Files already turned in stay.
- **Allow submissions past due date** defaults on. When off, turn-in stops after `due_at`.

## Rules

- Students do not have accounts. The actor is a parent linked to the student profile.
- Do not treat a submission file as a handout. Only the linked family and course staff can read it.
- Turn-in uses `begin_material_submission` / `finish_material_submission`. Do not open general parent file upload.
- This is not a quiz Submission and not a separate assignment object.

## Don’t

- Add grades, comments, Activity, or a Late badge here.
- Let a family append files to a submission after it is turned in.
- Copy turned-in files when copying a course.
