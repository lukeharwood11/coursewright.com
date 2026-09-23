# COURSE_SETTINGS

**URL:** `/my/<org-slug>/courses/<course_id>/settings`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors on the course; admins.

## Purpose

Configure the course instance (not content authoring — that’s [COURSE](./COURSE.md) / units / materials).


## Behavior

- Edit course instance configuration (not unit/material bodies).
- **Save** / **Cancel** sit in the page header (upper right). Save is disabled when nothing changed; Cancel goes back (confirms first if there are unsaved changes).
- Optional dates are informational only (not access gates).
- **Status** (active / archived) is whether the offering is running.
- **Publish / unpublish** controls whether enrolled students can see the course (distinct from status).
- Manage co-teachers.
- Soft-delete/archive TBD; no hard deletes of content.
- **P1:** promote from-scratch course to template or open linked template.

## Data shown

- Course **name** (editable)
- **Description**, **subject / area**, **location** (optional, editable)
- **Icon** (optional catalog icon for course list cards)
- **Calendar color** (from the course palette; used on This week / Calendar)
- **Start date**, **end date** (optional, editable)
- **Status** and **visibility** (publish / unpublish)
- **Grade-level metadata** (multi grade/range per org scheme)
- **Instructors** assigned to the course
- Optional origin “created from course …” when applicable (read-only, TBD)

## Contents

- Header: course name (slate tint chip) + “Course settings”; **Cancel** / **Save** (Save disabled when unchanged)
- Two-column layout on large screens (stacks on smaller viewports)
- Left: course name / description; schedule & status (dates, active / archived); **Unpublish** when published
- Right: catalog (icon, **calendar color**, subject / area, location, grade levels); instructors / co-teaching
- **Unpublished:** amber warning + Publish above the grid. **Published:** green Published badge; Unpublish under schedule & status
- Soft-delete / archive controls — TBD UX; content is soft-deleted only
- **P1:** Template link / promote to template

## Primary actions

- Save settings
- Manage instructors

## Links to

- [COURSE](./COURSE.md) — back to course builder
- [COURSE_ROSTER](./COURSE_ROSTER.md) — roster (related)
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD
- **P1:** [TEMPLATE](./TEMPLATE.md) — view linked template / after promote

## Notes

[FEATURES.md](../FEATURES.md) — Course rules, grade metadata, active course. Templates / promote = **P1**.
