# COURSE_LIST

**URL:** `/my/<org-slug>/courses`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors and admins (create + manage). Parents and student accounts (browse published courses they can see). Staff **Student view** uses the same family list.

## Purpose

Browse **course instances**. Staff also create offerings here.

## Behavior

- Requires org membership. Owners/admins: all courses; instructors: courses they teach, plus courses they parent in as read-only; parents/students: **active + published** courses visible via enrollment (RLS).
- Lists course instances; open row → course home (builder for staff; read-only for families).
- Staff create course **from scratch** or **from another course** (copies units/materials; independent — no live sync). New courses start **unpublished**. Instructors who create a course are added as its teacher automatically; owners/admins assign teachers manually. **Templates are P1** — not offered here in P0. Families never see create.
- Supports findability on this page: text search + subject filter by default; grade filters under **Advanced search**; pagination (12 per page). Product-wide advanced search remains separate in staff chrome.
- Empty (staff): prompt to create. Empty (family): plain language that published enrollments will appear here.
- Sidebar **Courses** for the student experience always links here (even with zero courses). Nested course links appear when any are visible.

## Data shown

Per course row (TBD density):

- Course **title** and optional **icon** (set on create or in settings)
- Optional **description**, **location**, **subject / area**
- **Status** (e.g. active) and **unpublished** badge when hidden from students (staff only — families only see published)
- Optional **start/end dates**
- **Grade metadata** in one pill (comma-separated, org scheme order)
- **Instructors** (avatars + names on catalog cards)
- **Active enrollment count** (students enrolled in the course)
- Optional “created from …” origin indicator when copied from another course (TBD density)

## Contents

- List of courses the viewer can see (title, description, location, subject, status, unpublished badge when staff, dates, **grade metadata in one pill**, instructors — TBD density)
- Find toolbar: search + subject by default; **Advanced search** expands grade chips; clear filters; Previous / Next pagination
- Create course (staff Teacher view only):
  - **From scratch** — blank course (starts unpublished)
  - **From another course** — pick a source course; copies units/materials; no roster; no live sync; copy starts unpublished
  - Optional **description**, **subject / area**, **location**, **icon** on the form
- Open → [COURSE](./COURSE.md)

## Primary actions

- Create course (staff; blank or from another course)
- Open a course
- Empty state (staff): create first course — roster not required to print later
- Empty state (family): no create CTA

## Links to

- [COURSE](./COURSE.md) — open a course
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD
- **P1:** [TEMPLATE_LIST](./TEMPLATE_LIST.md) — not in P0 create flow

## Notes

[FEATURES.md](../FEATURES.md) — Courses (P0), templates (P1), grade metadata, RBAC. Create → print does not require a roster.
