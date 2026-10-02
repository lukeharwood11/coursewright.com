# AGENTS — `src/grading/fill-cycles/`

Fill cycles, package checkpoints, staff-home to-dos, and manual reminders.

## Scope

- List and create at `/my/<org>/fill-cycles` (owners and admins create)
- Cycle detail: rollup, missing packages, close/reopen, remind
- `FillPackageBanner` on the gradebook and attendance sheets when `?cycle=` matches
- `FillCycleTodos` on the staff home

## Rules

- Soft due is urgency copy only. `status = closed` is what blocks a new submit.
- A submission row is the checkpoint. Do not freeze gradebook scores or attendance marks.
- Outcomes submit also writes `course_outcome_packages` for that cycle.
- Reminders are home rows. Do not send email or write Activity.
- Period feedback is optional on create and defaults on. The fill page is `period-feedback`.
- Slot lists use `fill_cycle_scope` so a class lead can count courses they do not teach.

## Don’t

- Assemble or send a student-term report card from here.
- Add a sidebar item. Home and this list are the entry points.
