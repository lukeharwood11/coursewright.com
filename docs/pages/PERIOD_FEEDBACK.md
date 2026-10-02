# PERIOD_FEEDBACK

**URL:** `/my/<org-slug>/courses/<course_id>/period-feedback?cycle=<cycle_id>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Staff who can view the course. People who can manage the course write and submit. Observers read. Parents and learners do not open this page.

## Purpose

Write a comment for each enrolled student for one fill cycle. This is separate from outcomes. It is the source a later report card can snapshot. The section toggle stays off.


## Behavior

- Requires `?cycle=`. Without a cycle that includes period feedback, the page explains that comments belong to a marking period.
- One text area per active enrollment. Leaving the field saves. Clearing it removes the comment.
- Comments are capped at 4000 characters.
- **Submit period feedback** records the package checkpoint. Blank students are allowed. Families can then read the comments that were saved.
- A closed cycle shows the comments and does not save or submit.
- Empty roster: enroll students first.
- This page does not freeze the comments while the cycle is open. It does not send a report card.

## Data shown

- Course title
- Cycle name
- Student name
- Comment text

## Contents

- Student comment fields
- Submit period feedback

## Primary actions

- Write or clear a comment
- Submit the package

## Links to

- [COURSE](./COURSE.md)
- [FILL_CYCLE](./FILL_CYCLE.md) — the to-do that opens this page
- Families read submitted comments on [PROGRESS](./PROGRESS.md) and [STUDENT_PROFILE](./STUDENT_PROFILE.md)

## Notes

[FEATURES.md](../FEATURES.md) — Report card templates (period-feedback slice). Not part of the gradebook mean. Not an outcome rating.
