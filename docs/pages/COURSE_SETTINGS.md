# COURSE_SETTINGS

**URL:** `/my/<org-slug>/courses/<course_id>/settings`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors on the course; admins.

## Purpose

Configure the course instance (not content authoring — that’s [COURSE](./COURSE.md) / units / materials).


## Behavior

- Edit course instance configuration (not unit/material bodies).
- Optional dates are informational only (not access gates).
- **Status** (e.g. active) gates parent membership rules together with enrollment.
- Manage co-teachers.
- Soft-delete/archive TBD; no hard deletes of content.
- **P1:** promote from-scratch course to template or open linked template.

## Data shown

- Course **name** (editable)
- **Start date**, **end date** (optional, editable)
- **Status**
- **Grade-level metadata** (multi grade/range per org scheme)
- **Instructors** assigned to the course
- Optional origin “created from course …” when applicable (read-only, TBD)

## Contents

- Course name
- Optional **start date** and **end date** (informational only — not access gates)
- **Status** (e.g. `active`) — parent org role requires student enrolled in a course with `status = active`
- **Grade-level metadata** — optional; multiple grades and/or ranges per org grade scheme
- **Instructors** — multiple instructors / co-teaching
- Soft-delete / archive controls — TBD UX; content is soft-deleted only
- **P1:** Template link / promote to template

## Primary actions

- Save settings
- Manage instructors

## Links to

- [COURSE](./COURSE.md) — back to course builder
- [COURSE_ROSTER](./COURSE_ROSTER.md) — roster (related)
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD
- **P1:** [TEMPLATE](./TEMPLATE.md) — view linked template / after promote

## Notes

[FEATURES.md](../FEATURES.md) — Course rules, grade metadata, active course. Templates / promote = **P1**.
