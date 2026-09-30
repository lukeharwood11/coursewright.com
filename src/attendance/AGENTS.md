# AGENTS — `src/attendance/`

Class sheets, course sheets, and whole-day attendance. Not a grade. Report-card package submit is out of this domain until fill cycles exist.

## Scope

- Class attendance (`class-attendance/`) at `/classes/<class_id>/attendance`
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
- Add a note column, custom statuses, or an attendance package submit here.
