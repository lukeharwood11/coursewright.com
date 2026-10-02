# AGENTS — `src/outcomes/`

Course outcomes and the org rating words teachers pick. Not letter grades, and not period feedback.

## Scope

- Org settings → Outcomes (`org-rating-options/`) — owners and admins edit the ordered labels
- Course outcomes (`course-outcomes/`) at `/courses/<course_id>/outcomes` — statements and optional criteria

## Rules

- Rating options are org-wide and separate from the grading scale.
- Outcomes belong to one course. Criteria are optional children.
- Owners and admins edit rating options. Course managers edit outcomes and criteria. Observers read.
- Archive an outcome instead of deleting it when it should leave the active list.
- Ratings, package submit, and Progress read are the next slice. Do not store freeform marking-period comments here.

## Don’t

- Put outcomes on the gradebook mean.
- Enable a report-card outcomes section from this folder.
