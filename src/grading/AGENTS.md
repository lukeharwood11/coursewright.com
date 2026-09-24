# AGENTS — `src/grading/`

Org grading: one scale, derived labels, course finals, and report-card workflow.

## Scope

- Settings → Grading (`org-grading/`)
- Course gradebook (`course-gradebook/`)
- Learner Progress (`progress/`)
- Report card draft and submit (`report-card/`)
- Student detail grades (`student-grades/`)

## Rules

- Do not overload `grade_scheme` / `grade_labels`.
- Quiz points stay on the attempt (`auto_points` / `teacher_points`). Gradable material points stay on `material_submissions`. Feedback-only materials stay out of the mean.
- Report card rows are `draft` | `submitted` | `sent`. The snapshot is a copy for the issued card, not a second score store.
- Class is not a grade container.
- Tier 1 View / Tier 2 View+Actions: parents view linked students; staff act on courses they can manage; owners and admins edit the scale.

## Don’t

- Add category weights, bulk send, or a parent grades home beyond this drill-down.
