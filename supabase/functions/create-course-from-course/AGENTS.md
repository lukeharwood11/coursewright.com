# AGENTS — `create-course-from-course`

P0 use case: copy a course’s units, materials, blocks, and quizzes into a new independent course.

## Rules

- Copy content only — no roster, important-now, share links, lesson plans, or quiz attempts.
- Share `file_id` (no blob clone).
- No live sync (`copied_from_course_id` is informational).
