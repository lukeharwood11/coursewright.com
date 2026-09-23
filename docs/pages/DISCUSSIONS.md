# DISCUSSIONS

**URL:** `/my/<org-slug>/discussions`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Owners, admins, and instructors in **Teacher view** use the staff list. Students (and staff **Student view**; linked parents inherit) use the same URL for threads that apply to their linked students. Both can compose when the FEATURES create rules allow it.

## Purpose

List two-way **discussions** for a course or a class. Distinct from [ANNOUNCEMENTS](./ANNOUNCEMENTS.md) (one-way, no replies).

## Behavior

- Load non-deleted discussions the actor can see (RLS). Hide threads with zero non-deleted messages.
- Sort by last activity (`last_message_at`), newest first.
- Filter chips: **All** / **Open** / **Resolved**. Default **All**.
- Unread first within the current filter (no `last_read_at`, or `last_message_at` after it). Unread rows show a notification icon; up-to-date rows have no leading icon.
- Opening a row goes to [DISCUSSION](./DISCUSSION.md).
- **New discussion** goes to compose when the actor may start one. Staff **Student view** without linked students: empty preview, no compose.
- While this list is open, **Realtime** refreshes new threads, last activity, answered state, and unread without a full page reload.

Empty: **There are no discussions at this time.** **New discussion** still shows when compose is allowed.

## Data shown

- Discussion **title**
- **Open** / **Resolved** badge (resolved includes a checkmark)
- **Audience** kind + name (course title or class name)
- Which child when a multi-student parent is looking at a class/course that only some children belong to
- **Last activity** time
- Unread notification icon (only when unread)
- Author of the thread (who started it)

## Contents

- Page title **Discussions**
- Filter chips
- List
- **New discussion**

## Primary actions

- Open a discussion
- Compose a new discussion (when allowed)

## Links to

- [DISCUSSION](./DISCUSSION.md) — view or new
- [ORG_HOME](./ORG_HOME.md) — back to home / this week
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); search overlay TBD
- Via student chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [RESOURCES](./RESOURCES.md) (when visible), [ACTIVITY](./ACTIVITY.md)

## Notes

[FEATURES.md](../FEATURES.md) — Discussions (**P1**, in progress). Parent sidebar shows a red count of unread discussions. Do not put a discussion card stack on This week home.
