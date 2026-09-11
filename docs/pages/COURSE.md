# COURSE

**URL:** `/my/<org-slug>/courses/<course_id>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors (builder). Admins as needed. Parents: read-focused variant of the same tree (simpler chrome).

## Purpose

Course builder home — structure units/materials for this offering; jump to roster and settings.


## Behavior

- Loads one course instance; instructor chrome for builders, simpler read chrome for parents.
- Browse **top-level materials** (no unit) **above** ordered units; materials may also nest under units.
- Add unit / add material (top-level or into a unit) when permitted.
- Print and share controls stay visible (not in overflow-only menus).
- Instructors can **publish / unpublish** the course (distinct from archive).
- Soft-delete / versioning entry points for dangerous actions (UX TBD).
- **P0:** no template linkage UI. Optional “created from course …” origin is informational only (no sync).
- **P1:** template-linked courses show linkage; promote / sync / override cues.

## Data shown

- Course **title**, optional **description**, **location**, **subject / area**, **status**, **visibility**, optional **dates**, **grade metadata**
- **Top-level materials** (title, description, kind/badge, dates, print)
- Ordered **units** (name, optional date range, material counts TBD)
- Materials under units: **title**, **description**, kind/badge, dates, print affordance
- **Instructors** (sidebar)
- Parent variant: same structure without edit controls; **unpublished courses 404**; **unpublished materials are omitted**

## Contents

- Course title; badges for status, unpublished, dates, subject / area, grade metadata ([STYLE_GUIDE.md](../STYLE_GUIDE.md) instructor course pattern)
- Optional description and location under the title
- Publish / unpublish banner (instructors)
- Top-level materials list (above units) with **title**, **description**, kind, **Print**; add material here or into a unit
- Units list (ordered) → [UNIT](./UNIT.md); add unit
- Materials under units: **title**, **description**, kind/badge, dates, print affordance
- Sidebar / secondary: instructors, link to [COURSE_ROSTER](./COURSE_ROSTER.md)
- Actions: Add material (page · link · file), Share (resource links), Print entry points; **Create course from this course** (copy → new independent course)
- Versioning / soft-delete awareness for dangerous actions (TBD exact UX)

## Primary actions

- Add / open unit or material
- Open roster / settings
- Publish / unpublish the course (instructors)
- Print unit or material (never buried)
- Create course from this course (copy)
- Share resource link (account required for recipients in P0)

## Parent variant

- Same URL tree; fewer edit controls; print still obvious; no builder clutter
- Unpublished courses are not visible (same URL 404s)

## Links to

- [UNIT](./UNIT.md) — open / add unit
- [MATERIAL](./MATERIAL.md) — open material from unit rows
- [PRINT](./PRINT.md) — **Print** on materials / **Print unit** entry points
- [COURSE_ROSTER](./COURSE_ROSTER.md) — course roster
- [COURSE_SETTINGS](./COURSE_SETTINGS.md) — course settings
- [COURSE_LIST](./COURSE_LIST.md) — after create-from-course lands on new course / list
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD
- **P1:** [TEMPLATE](./TEMPLATE.md) — linked template / promote target

## Notes

[FEATURES.md](../FEATURES.md) — Course builder, units, materials, create-from-course, extreme shareability. Create → print does not require a roster. **Print whole course** is out of scope (print lives on material / unit / parent this week). Templates = **P1**.
