# AGENTS — `src/outcomes/`

Course outcomes and the org rating words teachers pick. Not letter grades, and not period feedback.

## Scope

- Org settings → Outcomes (`org-rating-options/`) — owners and admins edit the ordered labels
- Course outcomes (`course-outcomes/`) at `/courses/<course_id>/outcomes` — statements and optional criteria
- Rating matrix (`course-ratings/`) at `/courses/<course_id>/outcomes/ratings` — submit writes `course_outcome_packages`
- Family read (`student-outcomes/`) on Progress and the student profile. Families see a rating only after the matching package is submitted

## Rules

- Rating options are org-wide and separate from the grading scale.
- Outcomes belong to one course. Criteria are optional children.
- Owners and admins edit rating options. Course managers edit outcomes and criteria. Observers read.
- Archive an outcome instead of deleting it when it should leave the active list.
- Do not store freeform marking-period comments here.

## Don’t

- Put outcomes on the gradebook mean.
- Enable a report-card outcomes section from this folder.
