# COURSE_OUTCOME_RATINGS

**URL:** `/my/<org-slug>/courses/<course_id>/outcomes/ratings`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Staff who can view the course. People who can manage the course rate and submit. Observers read. Parents and learners do not open this page.

## Purpose

Rate each enrolled student against the course’s outcomes (or each criterion, when the outcome has criteria) and submit that package so families can see it.


## Behavior

- One row per active enrollment. One control per active outcome, or per criterion when the outcome has criteria. Archived outcomes are not in the list.
- Choices are the organization’s **active** rating options, plus **Not rated**.
- Saving a choice writes immediately. Choosing Not rated clears that cell.
- **Submit outcomes** records a package checkpoint for this course. Blank cells are allowed. Submitting again updates the checkpoint. Past this point families can read the ratings that have a label.
- `?cycle=` stores the ratings and the package on that open fill cycle, and also marks the outcomes package submitted for the cycle. A closed cycle keeps the working set (no cycle id).
- Empty outcomes: send the teacher to edit outcomes. No students: ask them to enroll. No active rating words: send owners and admins to Settings → Outcomes.
- This page does not freeze the matrix. The report-card outcomes section stays off.

## Data shown

- Course title
- Student name
- Outcome statement, and criterion statement when the rating is for a criterion
- Selected rating label, or Not rated
- Submitted time, when a package exists

## Contents

- Student cards
- Rating menus
- Submit outcomes
- Link to edit outcomes
- Link back to the course

## Primary actions

- Set or clear a rating
- Submit outcomes
- Edit outcomes

## Links to

- [COURSE](./COURSE.md) — back to the course
- [COURSE_OUTCOMES](./COURSE_OUTCOMES.md) — edit outcomes and criteria
- [ORG_SETTINGS](./ORG_SETTINGS.md) — Outcomes tab when no rating words exist
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Course outcomes. Families read submitted ratings on [PROGRESS](./PROGRESS.md) and [STUDENT_PROFILE](./STUDENT_PROFILE.md). A fill-cycle id is set when this page is opened from a cycle. Not part of the gradebook mean.
