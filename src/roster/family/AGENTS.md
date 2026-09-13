# AGENTS — `src/roster/family/`

One **family**: a named group of student profiles (same shape as a Class).

- Members are students. Empty family is OK.
- Parents listed here come from `parent_student_links` — never from a family-membership access table.
- Linking a parent creates or reuses `parent_student_links` (or a pending `admin_invites` row with `role=parent` and `student_profile_id` if they have no account). **Never write enrollments.** Do not write `parent_invites`.
- A parent can appear on two families via links to students in each.
- Removing a student from the family does not drop those links.
