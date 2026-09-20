# AGENTS — `src/announcements/`

One-way **announcements**: a notice to a course, class, or student. Optional start/end dates. No reply thread.

## Scope

- Org list + **New announcement**
- Create / edit / view / soft-delete
- Parent/student home surfaces **current** announcements (date window, or until removed)
- Opening the view page marks it **read** (clears the notification icon)

## Rules

- Exactly one audience: course, class, or student.
- Date window **is** homepage availability — do not add a publish toggle.
- Soft-delete only. Course-from-course does **not** copy announcements.
- Page folders: `announcements/` (staff list), `announcement/` (view), `announcement-edit/` (new + edit). Shared `model/` + `databridge/`.
- Parent home composes this domain; do not put announcement CRUD in `parent/`.

## Don’t

- Treat this as email (P1 Notifications), a bulletin (those attach materials), or a discussion thread.
- Hard-delete announcement rows from the app.
