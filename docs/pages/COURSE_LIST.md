# COURSE_LIST

**URL:** `/my/<org-slug>/courses`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors and admins. Parents may reach courses via org home / deep links more than this list — TBD if parents see a simplified list.

## Purpose

Browse and create **course instances** (runnable offerings with optional dates and a roster).


## Behavior

- Requires org membership with access to courses (instructors/admins; parent visibility TBD).
- Lists course instances; open row → course builder home.
- Create course **from scratch** or **from another course** (copies units/materials; independent — no live sync). **Templates are P1** — not offered here in P0.
- Supports findability (list filters TBD; product search is P0 elsewhere).

## Data shown

Per course row (TBD density):

- Course **title**
- **Status** (e.g. active)
- Optional **start/end dates**
- **Grade metadata** (grades/ranges per org scheme)
- Instructors (names/avatars TBD)
- Optional “created from …” origin indicator when copied from another course (TBD density)

## Contents

- List of courses in the org (title, status, dates, grade metadata, instructors — TBD density)
- Facets / findability — advanced search is P0 product-wide; list filters TBD
- Create course:
  - **From scratch** — blank course
  - **From another course** — pick a source course; copies units/materials; no roster; no live sync
- Open → [COURSE](./COURSE.md)

## Primary actions

- Create course (blank or from another course)
- Open a course
- Empty state: create first course — roster not required to print later

## Links to

- [COURSE](./COURSE.md) — open a course
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD
- **P1:** [TEMPLATE_LIST](./TEMPLATE_LIST.md) — not in P0 create flow

## Notes

[FEATURES.md](../FEATURES.md) — Courses (P0), templates (P1), grade metadata, RBAC. Create → print does not require a roster.
