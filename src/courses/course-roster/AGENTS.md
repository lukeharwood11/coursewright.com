# AGENTS — `src/courses/course-roster/`

Course enrollments. List-first enrolled students; **Enroll students** opens batch multi-select (optional Class preset) or batch create-and-enroll. Empty roster is allowed — create → print does not require students.

Parent invites: copy `/invite/<token>` for an enrolled student who has a parent email (same claim path as staff; no email send). Membership is created on claim; course access still requires enrollment.
