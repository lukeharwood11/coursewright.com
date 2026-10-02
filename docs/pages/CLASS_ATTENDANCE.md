# CLASS_ATTENDANCE

**URL:** `/my/<org-slug>/classes/<class_id>/attendance`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Owners, admins, instructors, and observers. Parents and learners who open this URL are sent back to [CLASS](./CLASS.md).

## Purpose

Class-lead home for one class on one date. Take day-level attendance for the cohort, and correct course sheets for courses those students are in, without leaving the class. Supersedes a separate staff “Attendance today” screen.


## Behavior

- The class page has **Students** and **Attendance** tabs for staff. This URL is the Attendance tab. The label is **Attendance**.
- Previous day and Next day sit on either side of the date field. The date defaults to today (`?date=` keeps the same day).
- **Showing** chooses what the row controls write: **Day**, **This class**, or a course the viewer can manage (courses with an active enrollment among current class members). Observers do not get that menu or any write control.
- One row per current class member, plus anyone who already has a class-sheet row on that date. A course recording lists only students in that course (active enrollment or an existing mark that day). The list pages 20 students at a time.
- Each card shows only the mark for the surface in **Showing**. Writers use the status chips. Readers see one badge, or **Not marked**. Other sheets are not stacked on the card.
- When a day row exists, the bottom of the card says who marked it: “Ada marked Present”. There is no **Day mark** label. If no day row exists, that line is omitted.
- Day statuses: Present, Absent, Excused, Partial. Class and course sheet statuses: Present, Absent, Late, Excused. **Clear** is a text link under the chips, not a status chip. Choosing the selected status again does nothing. Undo restores the previous mark after a change, a clear, or Mark all Present.
- **Mark all Present** sets the current recording to Present for every row the viewer can write on that date, including students on other pages.
- A new class-sheet mark requires current membership. A new course mark requires an active enrollment. An existing row can still be changed by someone who can write that sheet. A day mark does not fill or erase sheet rows.
- Owners, admins, and a claimed class lead can write the day (a class lead only for current members) and this class’s sheet. Course correction follows who can manage that course.
- Observers see view-only copy. No status buttons, Clear, undo, or Mark all Present.
- Empty class: add students on the class page first.

## Data shown

- Class title
- Date and what the row is showing (day, this class, or a course)
- Per student: name, the mark for that surface, and a day attribution line when a day row exists

## Contents

- Students / Attendance tabs
- Date, with Previous day and Next day on either side
- Showing menu when there is more than one place to write
- Mark all Present when a row on this date can still be set to Present
- Student rows, paged
- Undo after a change

## Primary actions

- Pick a date
- Record the day, this class, or a course in this class
- Clear a mark and undo
- Mark all Present
- Open a student

## Links to

- [CLASS](./CLASS.md) — Students tab
- [COURSE_ATTENDANCE](./COURSE_ATTENDANCE.md) — course sheet, opened from the course
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open a student
- [ORG_ROSTER](./ORG_ROSTER.md) — back to Students → Classes
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Attendance. [plans/ATTENDANCE.md](../plans/ATTENDANCE.md). Not a grade. Report-card package submit is a later slice.
