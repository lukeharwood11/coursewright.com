# CLASS_ATTENDANCE

**URL:** `/my/<org-slug>/classes/<class_id>/attendance`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Owners, admins, instructors, and observers. Parents and learners who open this URL are sent back to [CLASS](./CLASS.md).

## Purpose

Record attendance for members of one class on one date. The class sheet is separate from course sheets and from the whole-day mark.


## Behavior

- Date picker defaults to today.
- One row per current class member, plus anyone who already has a class-sheet row on that date (they may have left the class).
- Sheet statuses: Present, Absent, Late, Excused. Choosing the selected status again clears it (the row is deleted).
- Day statuses on the same row: Present, Absent, Excused, Partial. Clear works the same way. A day mark does not fill or erase the class sheet.
- A new sheet mark requires current membership. An existing row can still be changed by someone who can write this sheet.
- Owners, admins, and a claimed class lead can write the sheet. Owners and admins can write the day for every row. A class lead can write the day for current members only. Observers read only.
- Each row shows a day summary badge. If another class or course sheet exists for that student on that date, the row says so.
- Clicking a status saves that student immediately.
- Empty class: add students on the class page first.

## Data shown

- Class title
- Date
- Per student: name, day summary badge, this class’s status, day status, and a hint when another sheet exists that day

## Contents

- Date picker
- Student rows with sheet and day controls (or read-only statuses)
- Link back to the class

## Primary actions

- Pick a date
- Set or clear this class’s status
- Set or clear the day status
- Open the student profile

## Links to

- [CLASS](./CLASS.md) — back to the class
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open a student
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Attendance. Not a grade. Report-card package submit is a later slice.
