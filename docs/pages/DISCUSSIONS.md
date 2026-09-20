# DISCUSSIONS

**URL:** `/my/<org-slug>/discussions`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Owners, admins, and instructors in **Teacher view** use the staff list. Parents (and staff **Parent view**) use the same URL for threads that apply to their linked students. Both can compose when the FEATURES create rules allow it.

## Purpose

List two-way **discussions** for a course or a class. Distinct from [ANNOUNCEMENTS](./ANNOUNCEMENTS.md) (one-way, no replies).

## Behavior

- Load non-deleted discussions the actor can see (RLS). Hide threads with zero non-deleted messages.
- Sort by last activity (`last_message_at`), newest first.
- Filter chips: **All** / **Open** / **Answered**. Default **All**.
- Unread first within the current filter (no `last_read_at`, or `last_message_at` after it). Unread rows show a notification icon.
- Opening a row goes to [DISCUSSION](./DISCUSSION.md).
- **New discussion** goes to compose when the actor may start one. Staff **Parent view** without linked students: empty preview, no compose.
- While this list is open, **Realtime** refreshes new threads, last activity, answered state, and unread without a full page reload.

Empty: plain language plus **New discussion** when compose is allowed. Families without a matching course or class: explain that discussions are for a class their child is in or a course they are enrolled in.

## Data shown

- Discussion **title**
- **Open** / **Answered** badge
- **Audience** kind + name (course title or class name)
- Which child when a multi-student parent is looking at a class/course that only some children belong to
- **Last activity** time
- Unread vs seen (icons)
- Author of the thread (who started it)

## Contents

- Page title **Discussions**
- Short line for families: talk with other families and teachers in a course or class
- Filter chips
- List
- **New discussion**

## Primary actions

- Open a discussion
- Compose a new discussion (when allowed)

## Links to

- [DISCUSSION](./DISCUSSION.md) — view or new
- [ORG_HOME](./ORG_HOME.md) — back to home / this week
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); search overlay TBD
- Via parent chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md)

## Notes

[FEATURES.md](../FEATURES.md) — Discussions (**P1**, in design). Parent sidebar shows a red count of unread discussions. Do not put a discussion card stack on This week home.
