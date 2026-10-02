# AGENTS — `src/attendance/`

Class sheets, course sheets, and whole-day attendance. Not a grade. A fill-cycle attendance checkpoint is the banner from `src/grading/fill-cycles/`, mounted on these sheets. It does not freeze marks.

## Scope

- Class Attendance tab (`class-attendance/`) at `/classes/<class_id>/attendance` — day mark and course-sheet correct; the card shows only the surface in Showing
- Course attendance (`course-attendance/`) at `/courses/<course_id>/attendance`
- Student history (`student-attendance/`) mounted on the student profile and Progress
- Shared sheet controls in `sheet/`
- Pure day-summary rules in `model/`; PostgREST in `databridge/`

## Rules

- Class rows, course rows, and day rows stay separate. Unset deletes the row.
- A new class mark requires current membership. A new course mark requires an active enrollment. Existing rows can still be edited.
- Parents and learners read their own history. They do not open the grids.
- `recorded_by` is set in the database. Do not send it from the client.

## Don’t

- Fold attendance into the gradebook mean.
- Add a note column, custom statuses, or a second attendance store for the package checkpoint.
