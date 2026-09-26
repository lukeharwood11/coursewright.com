# AGENTS — `src/parent/databridge/`

Load the student home from PostgREST: linked students, published enrollments, published materials, important now, published lesson plans for the current Sunday–Saturday week, and current announcements.

Staff modes:
- `loadInstructorPreviewDashboard` — taught published courses as a synthetic student
- `loadParentLinkedDashboard` — `parent_student_links` only
- `loadOwnStudentDashboard` — `student_profiles.user_id` only
- `loadParentDashboard` — prefer own profile, else parent links (real family accounts)
