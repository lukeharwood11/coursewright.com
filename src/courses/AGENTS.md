# AGENTS — `src/courses/`

Course **instances**: offerings with optional dates, roster link, instructors, status.

## Scope

- Course list/detail (builder shell) — **P0**
- Create from scratch or **from another course** (copy units/materials; Function candidate)
- Course instructors (co-teaching)
- `status = active` gates parent org access
- **P1:** `template_id` live link; promote course / content → template (Function)

## Rules

- Builder chrome: Print / Share / Add material visible ([STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md)).
- Units & materials are sibling domains — compose them; don’t duplicate.
- **P0:** no template UI. Course-from-course is an independent copy — **no live sync**.
- **P1:** Template → course sync only for unmodified copies — enforce via backend + clear UI badges (In sync / Overridden).

## Don’t

- Require a template to create a course (templates are **P1**).
- Use start/end dates as access gates (informational only).
- Invent template sync behavior for course-from-course copies.
