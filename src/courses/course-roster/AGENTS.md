# AGENTS — `src/courses/course-roster/`

Course enrollments and **teachers**. List-first enrolled students; **Enroll students** opens batch multi-select (optional Class preset) or batch create-and-enroll. Empty roster is allowed — create → print does not require students.

Owners and admins assign course teachers (same `course_instructors` rows as course settings). Instructors see the list.

Parent invites: email `/invite/<token>` for an enrolled student (Resend `organization-invite`; copy-link remains). Multiple parents are invited from the student profile. Membership is created on claim; course access still requires enrollment.
