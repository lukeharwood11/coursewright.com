# AGENTS — `src/roster/family/`

One **family**: a named group of student profiles (same shape as a Class).

- Members are students. Empty family is OK.
- Parents listed here come from `parent_student_links` — never from a family-membership access table.
- Linking a parent creates or reuses `parent_student_links` (or a pending `parent_invites` row if they have no account). **Never write enrollments.**
- A parent can appear on two families via links to students in each.
- Removing a student from the family does not drop those links.
