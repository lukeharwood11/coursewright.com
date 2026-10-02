# CLASS_ATTENDANCE

**URL:** `/my/<org-slug>/classes/<class_id>/attendance`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Owners, admins, instructors, and observers. Parents and learners who open this URL are sent back to [CLASS](./CLASS.md).

## Purpose

Class-lead home for one class on one date. Take day-level attendance for the cohort, and correct course sheets for courses those students are in, without leaving the class. Supersedes a separate staff “Attendance today” screen.


## Behavior

- The class page has **Students** and **Attendance** tabs for staff. This URL is the Attendance tab. The label is **Attendance**.
- Date picker defaults to today (`?date=` keeps the same day when a sheet link opens).
- **Showing** chooses what the row controls write: **Day**, **This class**, or a course the viewer can manage (courses with an active enrollment among current class members). Observers do not get that menu or any write control.
- One row per current class member, plus anyone who already has a class-sheet row on that date. A course recording lists only students in that course (active enrollment or an existing mark that day).
- Each row has **one** day summary badge. An explicit day row wins and is labeled **Day mark**. Otherwise, if expected course sheets disagree or some are still unmarked while another mark exists, the badge is **Partial** and the row lists each sheet (title and status). Agreeing sheets, including one sheet and Late, use that status. Nothing marked stays **Not marked**.
- Sheet lines link to that class or course attendance page when the viewer can open it. **Correct** switches Recording to a sheet the viewer may write, still on this class. Course sheets the viewer cannot open stay as text (instructors do not gain a path into another instructor’s course).
- Day statuses: Present, Absent, Excused, Partial. Class and course sheet statuses: Present, Absent, Late, Excused. **Clear** removes the mark. Choosing the selected status again does nothing. Undo restores the previous mark after a change, a clear, or Mark all Present.
- **Mark all Present** sets the current recording to Present for visible rows the viewer can write.
- A new class-sheet mark requires current membership. A new course mark requires an active enrollment. An existing row can still be changed by someone who can write that sheet. A day mark does not fill or erase sheet rows.
- Owners, admins, and a claimed class lead can write the day (a class lead only for current members) and this class’s sheet. Course correction follows who can manage that course.
- Observers see view-only copy. No status buttons, Clear, undo, or Mark all Present.
- Empty class: add students on the class page first.

## Data shown

- Class title
- Date and what the row is showing (day, this class, or a course)
- Per student: name, one day summary badge (and Day mark when a day row wins), sheet lines when they explain the day, and the control for the current recording

## Contents

- Students / Attendance tabs
- Date picker
- Showing menu when there is more than one place to write
- Mark all Present when a visible row can still be set to Present
- Student rows
- Undo after a change

## Primary actions

- Pick a date
- Record the day, this class, or a course in this class
- Clear a mark and undo
- Mark all Present
- Open a student, or a sheet the viewer can open

## Links to

- [CLASS](./CLASS.md) — Students tab
- [COURSE_ATTENDANCE](./COURSE_ATTENDANCE.md) — a course sheet the viewer can open
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open a student
- [ORG_ROSTER](./ORG_ROSTER.md) — back to Students → Classes
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Attendance. [plans/ATTENDANCE.md](../plans/ATTENDANCE.md). Not a grade. Report-card package submit is a later slice.
