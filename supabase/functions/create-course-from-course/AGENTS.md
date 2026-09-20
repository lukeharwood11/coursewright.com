# AGENTS — `create-course-from-course`

P0 use case: copy a course’s units, materials, and blocks into a new independent course.

## Rules

- Copy content only — no roster, important-now, share links, or lesson plans.
- Share `file_id` (no blob clone).
- No live sync (`copied_from_course_id` is informational).
