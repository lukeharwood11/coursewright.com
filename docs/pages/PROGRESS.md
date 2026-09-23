# PROGRESS

**URL:** `/my/<org-slug>/progress`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Learners: a student account, or staff using **Student view**. Teachers, parents, admins, and owners are sent to [ORG_ROSTER](./ORG_ROSTER.md).

## Purpose

“How am I doing?” Own classes, own course grades, and report cards that were sent to this student.


## Behavior

- Chrome label is **Progress**. Learners do not see the staff **Students** item.
- Loads the student profile whose `user_id` is the signed-in person. Staff Student view uses that same own-profile query so it does not list every student the staff role could read.
- Empty until the account is linked to a student.
- Classes open the canonical [CLASS](./CLASS.md) page, read-only for the learner.
- Grades are per course enrollment. The label comes from the org grading scale. Mode `none` shows a percent. A teacher final override shows that label.
- Report cards listed here are **sent** only.
- Activity for a saved quiz grade or a final override opens this page for the learner. A device notification uses `?activity=` and marks that row read.
- No bulk actions, no other students, no grading settings.

## Data shown

- Student name
- Classes: title
- Grades: course title, derived percent and label (or override label)
- Sent report cards: course title from the card snapshot

## Contents

- Classes list
- Grades list
- Report cards list

## Primary actions

- Open a class
- Open a sent report card

## Links to

- [CLASS](./CLASS.md) — own class
- [REPORT_CARD](./REPORT_CARD.md) — sent card
- [ORG_ROSTER](./ORG_ROSTER.md) — redirect for anyone who is not a learner
- Via learner chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md) when visible, [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)

## Notes

[FEATURES.md](../FEATURES.md) — Progress — grading. Class is not a grade. Scores stay on quiz attempts and the course final override.
