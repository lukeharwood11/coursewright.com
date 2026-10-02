# AGENTS — `src/grading/period-feedback/`

Freeform teacher comments for one course, one student, and one fill cycle.

## Rules

- Comments are not outcome ratings and do not enter the gradebook mean.
- A row exists only when the body is non-empty. Clearing the text deletes the row.
- Writes require an open fill cycle that includes period feedback.
- Families read a comment after the period-feedback package is submitted. Staff who can browse the course can read drafts. That read uses `family_period_feedback` so the cycle name does not depend on staff-only fill-cycle SELECT.
- The report-card section toggle stays off. This page is the source a later assemble step can snapshot.

## Don’t

- Send email or write Activity when the package is submitted.
- Store comments without a fill cycle.
