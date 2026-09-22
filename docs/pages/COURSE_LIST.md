# COURSE_LIST

**URL:** `/my/<org-slug>/courses`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors and admins. Parents may reach courses via org home / deep links more than this list — TBD if parents see a simplified list.

## Purpose

Browse and create **course instances** (runnable offerings with optional dates and a roster).


## Behavior

- Requires org membership with access to courses (owners/admins: all courses; instructors: courses they teach, plus courses they parent in as read-only).
- Lists course instances; open row → course builder home.
- Create course **from scratch** or **from another course** (copies units/materials; independent — no live sync). New courses start **unpublished**. Instructors who create a course are added as its teacher automatically; owners/admins assign teachers manually. **Templates are P1** — not offered here in P0.
- Supports findability on this page: text search + subject filter by default; grade filters under **Advanced search**; pagination (12 per page). Product-wide advanced search remains separate in staff chrome.

## Data shown

Per course row (TBD density):

- Course **title** and optional **icon** (set on create or in settings)
- Optional **description**, **location**, **subject / area**
- **Status** (e.g. active) and **unpublished** badge when hidden from families
- Optional **start/end dates**
- **Grade metadata** in one pill (comma-separated, org scheme order)
- **Instructors** (avatars + names on catalog cards)
- **Active enrollment count** (students enrolled in the course)
- Optional “created from …” origin indicator when copied from another course (TBD density)

## Contents

- List of courses in the org (title, description, location, subject, status, unpublished badge, dates, **grade metadata in one pill**, instructors — TBD density)
- Find toolbar: search + subject by default; **Advanced search** expands grade chips; clear filters; Previous / Next pagination
- Create course:
  - **From scratch** — blank course (starts unpublished)
  - **From another course** — pick a source course; copies units/materials; no roster; no live sync; copy starts unpublished
  - Optional **description**, **subject / area**, **location**, **icon** on the form
- Open → [COURSE](./COURSE.md)

## Primary actions

- Create course (blank or from another course)
- Open a course
- Empty state: create first course — roster not required to print later

## Links to

- [COURSE](./COURSE.md) — open a course
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD
- **P1:** [TEMPLATE_LIST](./TEMPLATE_LIST.md) — not in P0 create flow

## Notes

[FEATURES.md](../FEATURES.md) — Courses (P0), templates (P1), grade metadata, RBAC. Create → print does not require a roster.
