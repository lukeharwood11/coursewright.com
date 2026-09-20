# Course Wright — URL map

> **Status:** Draft — locked paths below. Behavior: [FEATURES.md](./FEATURES.md). Screen outlines: [pages/](./pages/). **These two docs must stay in sync** — see [AGENTS.md](./AGENTS.md#urlsmd-and-pages-must-match).

**Hosts:** `coursewright.com` (prod) · `beta.coursewright.com` (testing)

**Working convention:**

| Area | Pattern | Notes |
|------|---------|-------|
| Marketing / public site | `coursewright.com/…` | No auth required |
| Signed-in app | `coursewright.com/my/<org-slug>/…` | Org permalink scopes the session |
| Account (cross-org) | `coursewright.com/my/settings` | Outside a specific org |
| Auth | `/login`, `/signup`, `/invite/<token>` | Outside `/my` |
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
| [CONTACT](./pages/CONTACT.md) | `/contact` | Public emails (`hi@` / `support@`; `legal@` only on privacy) |
| [PRIVACY](./pages/PRIVACY.md) | `/privacy` | Privacy policy (incl. PostHog disclosure) |
| [TERMS](./pages/TERMS.md) | `/terms` | Terms of use |
| [COOKIES](./pages/COOKIES.md) | `/cookies` | Cookie policy (essential + PostHog when enabled) |
| [DOCS](./pages/DOCS.md) | `/docs` | Help — Getting started; nested `/docs/<slug>` topics |

---

## Auth

| Page | URL | Notes |
|------|-----|-------|
| [LOGIN](./pages/LOGIN.md) | `/login` | Email + password, magic link, Google |
| [SIGNUP](./pages/SIGNUP.md) | `/signup` | Email + password or Google; signs the person in on success |
| [INVITE_CLAIM](./pages/INVITE_CLAIM.md) | `/invite/<token>` | Parent or staff invite (`parent` / owner / admin / instructor). Loads unsigned; create account or sign in with the invited email, then accept. Email sent via Resend; copy-link remains |
| Auth callback | <!-- TBD — may be Supabase-hosted --> | |

---

## App entry & org context

| Page | URL | Notes |
|------|-----|-------|
| [ORG_PICKER](./pages/ORG_PICKER.md) | `/my` | Org picker + create org |
| [ORG_HOME](./pages/ORG_HOME.md) | `/my/<org-slug>` | Role-aware dashboard (parent “this week” calendar lives here) |
| [CALENDAR](./pages/CALENDAR.md) | `/my/<org-slug>/calendar` | Month/week/day calendar (`?view=month\|week\|day`, `?date=YYYY-MM-DD`) |
| [ACTIVITY](./pages/ACTIVITY.md) | `/my/<org-slug>/activity` | In-app notifications (unread first; click acks and opens the activity) |

---

## Account (user-level)

| Page | URL | Notes |
|------|-----|-------|
| [ACCOUNT_SETTINGS](./pages/ACCOUNT_SETTINGS.md) | `/my/settings` | Cross-org |
| [FEEDBACK](./pages/FEEDBACK.md) | `/my/feedback` · `/my/<org-slug>/feedback` | Profile menu **Send feedback**; org/name/email filled in |

---

## Organization settings & admin

| Page | URL | Notes |
|------|-----|-------|
| [ORG_SETTINGS](./pages/ORG_SETTINGS.md) | `/my/<org-slug>/settings` | Slug, grade scheme, **staff section** (not a separate top-level page) |
| [USER_PROFILE](./pages/USER_PROFILE.md) | `/my/<org-slug>/people/<user_id>` | Org-visible profile for a person with an account |
| Billing (P1) | <!-- TBD — under settings --> | Course Wright → org |

---

## Courses

| Page | URL | Notes |
|------|-----|-------|
| [COURSE_LIST](./pages/COURSE_LIST.md) | `/my/<org-slug>/courses` | |
| [COURSE](./pages/COURSE.md) | `/my/<org-slug>/courses/<course_id>` | Builder home |
| [COURSE_ROSTER](./pages/COURSE_ROSTER.md) | `/my/<org-slug>/courses/<course_id>/roster` | Enrollments |
| [COURSE_SETTINGS](./pages/COURSE_SETTINGS.md) | `/my/<org-slug>/courses/<course_id>/settings` | Dates, status, instructors, grades, calendar color |
| [LESSON_PLAN](./pages/LESSON_PLAN.md) (view) | `/my/<org-slug>/courses/<course_id>/lesson-plans/<lesson_plan_id>` | Week plan + day notes and materials |
| [LESSON_PLAN](./pages/LESSON_PLAN.md) (new) | `/my/<org-slug>/courses/<course_id>/lesson-plans/new` | Staff compose (`?week=` optional Sunday) |
| [LESSON_PLAN](./pages/LESSON_PLAN.md) (edit) | `/my/<org-slug>/courses/<course_id>/lesson-plans/<lesson_plan_id>/edit` | Staff edit |

---

## Announcements

One-way notices (course, class, or student). Org-scoped because the audience is not always a course.

| Page | URL | Notes |
|------|-----|-------|
| [ANNOUNCEMENTS](./pages/ANNOUNCEMENTS.md) | `/my/<org-slug>/announcements` | Staff list (Teacher view); parent list of current notices (parent chrome / Parent view) |
| [ANNOUNCEMENT](./pages/ANNOUNCEMENT.md) (view) | `/my/<org-slug>/announcements/<announcement_id>` | Families open from home; staff open from the list |
| [ANNOUNCEMENT](./pages/ANNOUNCEMENT.md) (new) | `/my/<org-slug>/announcements/new` | Staff compose. Optional `?audience=course\|class\|student` plus `courseId` / `classId` / `studentId` |
| [ANNOUNCEMENT](./pages/ANNOUNCEMENT.md) (edit) | `/my/<org-slug>/announcements/<announcement_id>/edit` | Staff edit |

---

## Discussions (**P1**)

Two-way threads (one course or one class). Org-scoped because the audience is not always a course.

| Page | URL | Notes |
|------|-----|-------|
| [DISCUSSIONS](./pages/DISCUSSIONS.md) | `/my/<org-slug>/discussions` | Staff list (Teacher view); family list (parent chrome / Parent view) |
| [DISCUSSION](./pages/DISCUSSION.md) (view) | `/my/<org-slug>/discussions/<discussion_id>` | Thread: flat posts, quote-in-body, plain/Lexical, attachments, answered |
| [DISCUSSION](./pages/DISCUSSION.md) (new) | `/my/<org-slug>/discussions/new` | Compose. Optional `?audience=course\|class` plus `courseId` / `classId` |

No `/edit` route — title and audience are not edited after create in this slice.

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
| [PRINT](./pages/PRINT.md) (this week) | `/my/<org-slug>/print-this-week` | Parent dashboard grain; Sun–Sat + important now. Optional `?students=` limits to active students |

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

Covered by [ORG_HOME](./pages/ORG_HOME.md) + [CALENDAR](./pages/CALENDAR.md) + read-focused use of the course / unit / material tree. **Lesson plans** open [LESSON_PLAN](./pages/LESSON_PLAN.md). **Announcements** open [ANNOUNCEMENT](./pages/ANNOUNCEMENT.md). **Discussions** (**P1**) open [DISCUSSION](./pages/DISCUSSION.md). No separate `/home` path in P0. Staff can switch to that presentation with **Parent view** in org chrome.

---

## Not locked yet (no `pages/` file until path is set)

| Concern | Status |
|---------|--------|
| Resource share entry URLs | TBD |
| Search as a route vs overlay | TBD |

---

## Open questions

1. **Share / resource links** — `/s/<token>` or other? Staff invites use `/invite/<token>`.
2. **Search** — overlay only, or `/my/<org-slug>/search`?
