# COURSE_ATTENDANCE

**URL:** `/my/<org-slug>/courses/<course_id>/attendance`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Staff who can view the course (people who can manage it, and observers). Parents and learners do not open this sheet.

## Purpose

Course instructors record attendance for one course on one date. This sheet is their primary write surface. It is separate from the class Attendance tab and from the whole-day mark.


## Behavior

- Previous day and Next day sit on either side of the date field. The date defaults to today (`?date=` opens that day).
- One row per **active** enrollment, plus anyone who already has a course-sheet row on that date. The list pages 20 students at a time.
- Each card shows only this course’s mark. Writers use the status chips. Readers see one badge, or **Not marked**. There is no “This course” label and no other sheet lines on the card.
- When a day row exists, the bottom of the card says who marked the day (“Ada marked Present”). That line is not edited here. If no day row exists, it is omitted.
- Sheet statuses: Present, Absent, Late, Excused. **Clear** is a text link under the chips, not a status chip. Choosing the selected status again does nothing. Undo follows a change, a clear, or Mark all Present.
- **Mark all Present** sets this course to Present for every row the viewer can write on that date, including students on other pages.
- A new sheet mark requires an active enrollment. An existing row can still be changed by someone who can manage the course.
- People who can manage the course write the sheet. Observers read only, with view-only copy and no write controls.
- Empty roster: enroll students before taking attendance.

## Data shown

- Course title
- Date
- Per student: name, this course’s status, and a day attribution line when a day row exists

## Contents

- Date, with Previous day and Next day on either side
- Mark all Present when a row can still be set to Present
- Student rows, paged
- Undo after a change
- Link back to the course

## Primary actions

- Pick a date
- Set or clear this course’s status
- Mark all Present
- Undo
- Open the student profile

## Links to

- [COURSE](./COURSE.md) — back to the course
- [COURSE_ROSTER](./COURSE_ROSTER.md) — enrollments
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open a student
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Attendance. Not part of the gradebook mean.
