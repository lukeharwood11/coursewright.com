# UNIT

**URL (course):** `/my/<org-slug>/courses/<course_id>/units/<unit_id>`  
**URL (template, P1):** `/my/<org-slug>/templates/<template_id>/units/<unit_id>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors/editors on the course (**P0**) or template (**P1**). Parents: read + print when shared via enrollment.

## Purpose

One **unit** — optional ordered group of materials; optional dates. Materials may also sit at **course top level** (no unit) — see [COURSE](./COURSE.md).


## Behavior

- Show one unit in a **course** context (**P0**). Template URL tree is **P1**.
- List materials in this unit; add material (**page** / **link** / **file**) / reorder when permitted. Parents only see **published** materials.
- Course-level materials (no unit) appear on [COURSE](./COURSE.md) **above** the units list — not on this page.
- **Print unit** produces one continuous packet (P0); opens [PRINT](./PRINT.md) at `…/units/<unit_id>/print`.
- Dating: optional unit range; material `scheduled_date` wins for “this week” when set.
- **P1:** Template vs course override/promote/sync cues when linked.

## Data shown

- Unit **title**, **order**
- Optional unit **start/end dates** (or range)
- Materials: **title**, **description**, kind/badge, optional **scheduled_date**, unpublished badge (instructors), important-now badge, print affordance
- Parent course name for orientation (**P1:** or template name)

## Contents

- Unit title; order in course
- Optional unit `start_date` / `end_date` (or range)
- Materials list (icon, name, badges, dates) → [MATERIAL](./MATERIAL.md)
- **Print unit** — continuous packet of materials in order (P0; control on unit header — never overflow-only) → [PRINT](./PRINT.md)
- Add / reorder materials (edit+) — **Add material:** page · link · file
- **P1:** Template↔course cues: overridden copy, promote, deprecate/delete impact (TBD chrome density)

## Primary actions

- Open / add material (page · link · file)
- Print unit
- Edit unit dates / title
- Reorder materials

## Links to

- [MATERIAL](./MATERIAL.md) — open / add material
- [COURSE](./COURSE.md) — parent course
- Via org chrome (instructor/admin): [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD
- Parent return: [ORG_HOME](./ORG_HOME.md) (simpler chrome)
- [PRINT](./PRINT.md) — **Print unit** → `…/units/<unit_id>/print`
- **P1:** [TEMPLATE](./TEMPLATE.md) — when under a template

## Notes

[FEATURES.md](../FEATURES.md) — Units optional; dating; print grain (unit). Top-level materials live on [COURSE](./COURSE.md). “This week” uses material `scheduled_date` if set, else unit range when the material has a unit; week = Sunday–Saturday. **Print whole course** is out of scope. Create → print does not require a roster. Templates = **P1**.
