# AGENTS — `src/roster/`

Student profiles, **classes** (student groups), course enrollments, parent invites / links.

## Scope

- Student profiles (name required; parent email & grade optional)
- **Class** — org-scoped group of students (not a course; no materials)
- Org roster (`org-roster/`), class roster (`class-roster/`), course roster (`course-roster/`), student profile
- Parent email linkage + invites
- Staff assignment UI that belongs with roster (course instructors may live with `courses/`)

## Rules

- Students are **profiles**, not accounts (P0/P1).
- **Class ≠ Course** — do not put units/materials on a class.
- Course ↔ Class enrollment relationship is **workshop** in FEATURES — do not invent until locked; keep student↔course enrollment as the access gate.
- Parent access still requires invite + account ([FEATURES.md](../../docs/FEATURES.md)).
- Follow frontend-development skill page-folder pattern under this domain.

## Don’t

- Build student login — P2.
- Hide roster complexity behind LMS jargon.
- Treat Class as a synonym for Course in UI copy.
