# Course Wright — URL map

> **Status:** Draft — locked paths below. Behavior: [FEATURES.md](./FEATURES.md). Screen outlines: [pages/](./pages/). **These two docs must stay in sync** — see [AGENTS.md](./AGENTS.md#urlsmd-and-pages-must-match).

**Hosts:** `coursewright.com` (prod) · `beta.coursewright.com` (testing)

**Working convention:**

| Area | Pattern | Notes |
|------|---------|-------|
| Marketing / public site | `coursewright.com/…` | No auth required |
| Signed-in app | `coursewright.com/my/<org-slug>/…` | Org permalink scopes the session |
| Account (cross-org) | `coursewright.com/my/settings` | Outside a specific org |
| Auth | `/login`, `/signup`, invite claim URLs | Outside `/my` |
| Share / deep links | Short entry URLs that resolve into `/my/…` after login | Account required in P0 — paths TBD |

`<org-slug>` = organization permalink ([FEATURES.md](./FEATURES.md) — changing it warns that links break; no auto-redirect in P0).

Opaque ids in paths: `<course_id>`, `<template_id>`, `<unit_id>`, `<material_id>`, `<student_id>`, `<family_id>`, `<class_id>` — **numeric `bigint`** (bigserial) for app entities, not slugs. Auth user ids remain UUIDs outside these paths.

### Nesting rule

If a resource would reasonably have **more than one page** underneath it, nest those pages under its id (longer path). If it’s a single leaf view, keep the path short.

---

## Home / marketing

| Page | URL | Notes |
|------|-----|-------|
| [HOME](./pages/HOME.md) | `/` | Sales landing — P0 |
| [ABOUT](./pages/ABOUT.md) | `/about` | P0 |
| [PRICING](./pages/PRICING.md) | `/pricing` | P0 |
| [CONSTRUCTION](./pages/CONSTRUCTION.md) | `/contact`, `/privacy`, `/terms`, `/cookies` | Shared footer placeholder until copy exists. Intended privacy outline: [PRIVACY](./pages/PRIVACY.md) |

---

## Auth

| Page | URL | Notes |
|------|-----|-------|
| [LOGIN](./pages/LOGIN.md) | `/login` | Email + password, magic link, Google |
| [SIGNUP](./pages/SIGNUP.md) | `/signup` | Email + password or Google; signs the person in on success |
| Invite claim | <!-- TBD --> | No page file until path locked |
| Auth callback | <!-- TBD — may be Supabase-hosted --> | |

---

## App entry & org context

| Page | URL | Notes |
|------|-----|-------|
| [ORG_PICKER](./pages/ORG_PICKER.md) | `/my` | Org picker + create org |
| [ORG_HOME](./pages/ORG_HOME.md) | `/my/<org-slug>` | Role-aware dashboard (parent “this week” lives here) |

---

## Account (user-level)

| Page | URL | Notes |
|------|-----|-------|
| [ACCOUNT_SETTINGS](./pages/ACCOUNT_SETTINGS.md) | `/my/settings` | Cross-org |

---

## Organization settings & admin

| Page | URL | Notes |
|------|-----|-------|
| [ORG_SETTINGS](./pages/ORG_SETTINGS.md) | `/my/<org-slug>/settings` | Slug, grade scheme, **staff section** (not a separate top-level page) |
| Billing (P1) | <!-- TBD — under settings --> | Course Wright → org |

---

## Courses

| Page | URL | Notes |
|------|-----|-------|
| [COURSE_LIST](./pages/COURSE_LIST.md) | `/my/<org-slug>/courses` | |
| [COURSE](./pages/COURSE.md) | `/my/<org-slug>/courses/<course_id>` | Builder home |
| [COURSE_ROSTER](./pages/COURSE_ROSTER.md) | `/my/<org-slug>/courses/<course_id>/roster` | Enrollments |
| [COURSE_SETTINGS](./pages/COURSE_SETTINGS.md) | `/my/<org-slug>/courses/<course_id>/settings` | Dates, status, instructors, grades |

---

## Course templates (**P1**)

| Page | URL | Notes |
|------|-----|-------|
| [TEMPLATE_LIST](./pages/TEMPLATE_LIST.md) | `/my/<org-slug>/templates` | **P1** — not in P0 nav/UI |
| [TEMPLATE](./pages/TEMPLATE.md) | `/my/<org-slug>/templates/<template_id>` | **P1** builder home |
| [TEMPLATE_SETTINGS](./pages/TEMPLATE_SETTINGS.md) | `/my/<org-slug>/templates/<template_id>/settings` | **P1** ACL, metadata |

Create course from template: action from template UI (**P1**; no dedicated path).

**P0 reuse:** create course from another course — action from [COURSE_LIST](./pages/COURSE_LIST.md) / [COURSE](./pages/COURSE.md) (no dedicated path).

---

## Units & materials

Same page docs serve **course** URLs (**P0**) and **template** URL trees (**P1**).

Materials may be **top-level** (no unit) or nested under a unit.

| Page | URL (course, P0) | URL (template, P1) |
|------|------------------|--------------------|
| [UNIT](./pages/UNIT.md) | `/my/<org-slug>/courses/<course_id>/units/<unit_id>` | `/my/<org-slug>/templates/<template_id>/units/<unit_id>` |
| [MATERIAL](./pages/MATERIAL.md) (top-level) | `/my/<org-slug>/courses/<course_id>/materials/<material_id>` | `/my/<org-slug>/templates/<template_id>/materials/<material_id>` |
| [MATERIAL](./pages/MATERIAL.md) (in unit) | `…/units/<unit_id>/materials/<material_id>` | `…/units/<unit_id>/materials/<material_id>` |
| Material **edit** | `…/materials/<material_id>/edit` | Same suffix on course or template tree |

**View** = material URL without `/edit`. **Edit** = append `/edit` (instructors/editors). Parents use view only.

---

## Print (P0)

Dedicated `/print` child routes — **generate a PDF**, preview it in-app, then **Download** or **Print**. Not named Export. **Print whole course** is out of scope.

| Page | URL | Notes |
|------|-----|-------|
| [PRINT](./pages/PRINT.md) (material, top-level) | `/my/<org-slug>/courses/<course_id>/materials/<material_id>/print` | Same on template tree (**P1**) |
| [PRINT](./pages/PRINT.md) (material, in unit) | `…/units/<unit_id>/materials/<material_id>/print` | |
| [PRINT](./pages/PRINT.md) (unit) | `/my/<org-slug>/courses/<course_id>/units/<unit_id>/print` | Packet in material order |
| [PRINT](./pages/PRINT.md) (this week) | `/my/<org-slug>/print-this-week` | Parent dashboard grain; Sun–Sat + important now |

**Do not use** `?print=1` on the source page — print is its own chrome-free screen with a real PDF viewer.

---

## Roster & families

| Page | URL | Notes |
|------|-----|-------|
| [ORG_ROSTER](./pages/ORG_ROSTER.md) | `/my/<org-slug>/roster` | Org student profiles + class list |
| [STUDENT_PROFILE](./pages/STUDENT_PROFILE.md) | `/my/<org-slug>/roster/<student_id>` | |
| [CLASS](./pages/CLASS.md) | `/my/<org-slug>/classes/<class_id>` | Class roster (student group) |
| [FAMILIES](./pages/FAMILIES.md) | `/my/<org-slug>/families` | Parent directory — **not currently routed in SPA** |
| [FAMILY](./pages/FAMILY.md) | `/my/<org-slug>/families/<family_id>` | **Not currently routed in SPA** |

---

## Parent experience

Covered by [ORG_HOME](./pages/ORG_HOME.md) + read-focused use of the course / unit / material tree. No separate `/home` path in P0.

---

## Not locked yet (no `pages/` file until path is set)

| Concern | Status |
|---------|--------|
| Invite claim URLs | TBD |
| Resource share entry URLs | TBD |
| Search as a route vs overlay | TBD |

---

## Open questions

1. **Share / invite links** — `/invite/<token>`, `/s/<token>`, or other?
2. **Search** — overlay only, or `/my/<org-slug>/search`?
