# COURSE_ATTENDANCE

**URL:** `/my/<org-slug>/courses/<course_id>/attendance`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Staff who can view the course (people who can manage it, and observers). Parents and learners do not open this sheet.

## Purpose

Course instructors record attendance for one course on one date. This sheet is their primary write surface. It is separate from the class Attendance tab and from the whole-day mark.


## Behavior

- Date picker defaults to today (`?date=` opens that day).
- One row per **active** enrollment, plus anyone who already has a course-sheet row on that date.
- One day summary badge per student. A day mark is labeled **Day mark** and is not edited on this sheet. Sheet rows explain Partial when recorded sheets disagree.
- Sheet statuses: Present, Absent, Late, Excused. **Clear** removes the mark. Choosing the selected status again does nothing. Undo follows a change, a clear, or Mark all Present.
- **Mark all Present** sets this course to Present for rows the viewer can write.
- A new sheet mark requires an active enrollment. An existing row can still be changed by someone who can manage the course.
- People who can manage the course write the sheet. Observers read only, with view-only copy and no write controls.
- A class sheet that exists that day links to that class’s Attendance tab. Other course sheets are named without a link.
- Empty roster: enroll students before taking attendance.

## Data shown

- Course title
- Date
- Per student: name, day summary badge, this course’s status, and other sheet lines for that day

## Contents

- Date picker
- Mark all Present when a row can still be set to Present
- Student rows
- Undo after a change
- Link back to the course

## Primary actions

- Pick a date
- Set or clear this course’s status
- Mark all Present
- Undo
- Open the student profile
- Open a class Attendance tab when that sheet is listed

## Links to

- [COURSE](./COURSE.md) — back to the course
- [COURSE_ROSTER](./COURSE_ROSTER.md) — enrollments
- [CLASS_ATTENDANCE](./CLASS_ATTENDANCE.md) — a class sheet listed on the row
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open a student
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Attendance. Not part of the gradebook mean.
