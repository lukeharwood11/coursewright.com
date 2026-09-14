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
- **Status** (active / archived) is whether the offering is running.
- **Publish / unpublish** controls whether enrolled families can see the course (distinct from status).
- Manage co-teachers.
- Soft-delete/archive TBD; no hard deletes of content.
- **P1:** promote from-scratch course to template or open linked template.

## Data shown

- Course **name** (editable)
- **Description**, **subject / area**, **location** (optional, editable)
- **Icon** (optional catalog icon for course list cards)
- **Start date**, **end date** (optional, editable)
- **Status** and **visibility** (publish / unpublish)
- **Grade-level metadata** (multi grade/range per org scheme)
- **Instructors** assigned to the course
- Optional origin “created from course …” when applicable (read-only, TBD)

## Contents

- Course name
- Optional **description**, **subject / area**, **location**, **icon**
- Optional **start date** and **end date** (informational only — not access gates)
- **Status** (`active` / `archived`) — offering is running vs archived
- **Publish / unpublish** — families see the course only when it is active **and** published
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
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD
- **P1:** [TEMPLATE](./TEMPLATE.md) — view linked template / after promote

## Notes

[FEATURES.md](../FEATURES.md) — Course rules, grade metadata, active course. Templates / promote = **P1**.
