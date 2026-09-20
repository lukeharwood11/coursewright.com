# AGENTS — `src/courses/`

Course **instances**: offerings with optional dates, roster, instructors, catalog fields, status, and publish state.

## Scope

- Course list/detail (builder shell) — **P0**
- Create from scratch or **from another course** (copy units/materials; Function candidate)
- Course instructors (co-teaching)
- Catalog: **description**, **location**, **subject / area**, **calendar color** (`color_key`)
- `status = active` means the offering is running; `visibility = published` is what enrolled parents can see
- **P1:** `template_id` live link; promote course / content → template (Function)

## Rules

- Builder chrome: Print / Share / Add material / **Add lesson plan** visible ([STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md)).
- Units & materials are sibling domains — compose them; don’t duplicate.
- **P1 discussions** are a sibling domain — course page may link to compose (`?audience=course&courseId=`), not own the thread UI.
- **P0:** no template UI. Course-from-course is an independent copy — **no live sync**. Copies start unpublished.
- Course visibility helpers live in `courses/model/` (not materials).
- **P1:** Template → course sync only for unmodified copies — enforce via backend + clear UI badges (In sync / Overridden).

## Don’t

- Require a template to create a course (templates are **P1**).
- Use start/end dates as access gates (informational only).
- Invent template sync behavior for course-from-course copies.
