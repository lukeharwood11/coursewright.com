# COURSE_ATTENDANCE

**URL:** `/my/<org-slug>/courses/<course_id>/attendance`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Staff who can view the course (people who can manage it, and observers). Parents and learners do not open this sheet.

## Purpose

Record attendance for students enrolled in one course on one date. The course sheet is separate from class sheets and from the whole-day mark.


## Behavior

- Date picker defaults to today.
- One row per **active** enrollment, plus anyone who already has a course-sheet row on that date.
- Sheet statuses: Present, Absent, Late, Excused. Choosing the selected status again clears it.
- Day statuses: Present, Absent, Excused, Partial. A day mark does not fill or erase the course sheet.
- A new sheet mark requires an active enrollment. An existing row can still be changed by someone who can manage the course.
- People who can manage the course write the sheet. Owners and admins write the day for every row. A course instructor writes the day for active enrollments only. Observers read only.
- Each row shows a day summary badge and a hint when another sheet exists that day.
- Clicking a status saves that student immediately.
- Empty roster: enroll students before taking attendance.

## Data shown

- Course title
- Date
- Per student: name, day summary badge, this course’s status, day status, and a hint when another sheet exists that day

## Contents

- Date picker
- Student rows with sheet and day controls (or read-only statuses)
- Link back to the course

## Primary actions

- Pick a date
- Set or clear this course’s status
- Set or clear the day status
- Open the student profile

## Links to

- [COURSE](./COURSE.md) — back to the course
- [COURSE_ROSTER](./COURSE_ROSTER.md) — enrollments
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open a student
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Attendance. Not part of the gradebook mean.
