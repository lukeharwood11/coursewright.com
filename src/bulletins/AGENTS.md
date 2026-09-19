# AGENTS — `src/bulletins/`

Dated course **bulletins**: a notice with a start and end date, plus optional materials listed underneath.

## Scope

- Course list of bulletins + **Add bulletin**
- Create / edit / view / soft-delete
- Parent/student home surfaces **available** bulletins (today in start–end)
- View page is links to attached materials

## Rules

- Date window **is** availability — do not add a publish toggle.
- Materials must belong to the same course. Families only follow **published** materials (RLS).
- Soft-delete only. Course-from-course does **not** copy bulletins.
- Page folders: `bulletin/` (view), `bulletin-edit/` (new + edit). Shared `model/` + `databridge/`.
- Parent home composes this domain; do not put bulletin CRUD in `parent/`.

## Don’t

- Treat this as email (P1 Notifications) or as a separate assignment object.
- Hard-delete bulletin rows from the app.
- Attach materials from another course.
