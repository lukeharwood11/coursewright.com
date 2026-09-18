# AGENTS — `src/roster/`

Student profiles, **classes** (student groups), **families** (parent directory — databridge/model only while SPA UI is unrouted), course enrollments, parent invites / links.

## Scope

- Student profiles (name required; parent emails, student email & grade optional)
- **Class** — org-scoped group of students (not a course; no materials)
- **Family** — org-scoped household in the parent directory (not a course; no materials). Schema + `databridge/families` + `model/family` remain; `families/` and `family/` page folders are **not currently routed**.
- Org roster (`org-roster/`), class roster (`class-roster/`), course roster (`course-roster/`), student profile
- Parent email linkage + invites (copyable `/invite/<token>`; same claim path as staff)
- Staff assignment UI that belongs with roster (course instructors may live with `courses/`)

## Rules

- Students are **profiles**, not accounts (P0/P1).
- **Class ≠ Course** — do not put units/materials on a class.
- **Family ≠ access** — a family is a named group of `student_profile`s (Class-mirror). Parents appear only via `parent_student_links` to those students. Do not write `family_members.parent_user_id` as an access gate. Linking a parent creates or reuses the student link (`admin_invites` with `role=parent` if no account). Never write enrollments from this directory.
- Course ↔ Class: course enrolls **individuals**; Class is a **batch preset** into the course picker (one-shot, not a live link). Parent access stays enrollment-only.
- Parent access still requires invite + account ([FEATURES.md](../../docs/FEATURES.md)). Membership is created on claim; course materials still require enrollment.
- Batch select is the default add path on org / class / course roster (multi-select + batch create).
- Follow frontend-development skill page-folder pattern under this domain.
- Do not re-expose `/families` routes or nav until product asks to restore the directory UI.

## Don’t

- Build student login — P2.
- Hide roster complexity behind LMS jargon.
- Treat Class as a synonym for Course in UI copy.
- Grant materials, this-week, or print from family membership.
- Invent a live Class↔Course enrollment sync.
