# ANNOUNCEMENTS

**URL:** `/my/<org-slug>/announcements`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Owners, admins, and instructors in **Teacher view** use the staff list (compose). Parents (and staff **Parent view**) use the same URL for a family list of **current** notices — no compose.

## Purpose

Staff: list of one-way announcements in the organization, grouped by whether families see them now.  
Families: all current notices that apply to them, with unread vs seen state.

## Behavior

### Staff (Teacher view)

- Load non-deleted announcements for the org the staff member can see (RLS).
- Group as **Available now**, **Upcoming**, and **Ended** (local calendar date vs optional start/end). Undated notices sit in **Available now** until removed.
- Each row shows title, audience kind, a truncated target summary, and dates when set.
- Opening a row goes to [ANNOUNCEMENT](./ANNOUNCEMENT.md).
- **New announcement** goes to compose.

Empty: plain language plus **New announcement**.

### Parents (and staff Parent view)

- Load **current** announcements that apply to linked students (same set as [ORG_HOME](./ORG_HOME.md)).
- Unread first. Unread rows show a notification icon; opened (acked) rows show a **read receipt** (check) icon.
- Opening a row goes to [ANNOUNCEMENT](./ANNOUNCEMENT.md) and marks it read.
- No **New announcement**. Staff Parent view without linked students sees an empty list (preview).

Empty: “No announcements right now.”

## Data shown

### Staff

- Announcement **title**
- **Audience** kind + name (course title, class title, or student name)
- **Author** and **Posted** date (when staff created it) — always shown
- Optional **start date** / **end date**
- Availability grouping (available now / upcoming / ended)

### Parents

- Announcement **title**, optional body preview
- Audience / targets; which child when multi-student
- **Author** and **Posted** date
- Unread vs seen (icons)
- Optional visibility date range when set

## Contents

### Staff

- Page title **Announcements**
- Grouped list
- **New announcement**

### Parents

- Page title **Announcements**
- Short line: notes from teachers; opening marks seen
- List with unread / seen icons

## Primary actions

- Open an announcement
- Compose a new announcement (staff Teacher view only)

## Links to

- [ANNOUNCEMENT](./ANNOUNCEMENT.md) — view or new
- [ORG_HOME](./ORG_HOME.md) — back to home / this week
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); search overlay TBD
- Via parent chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md)

## Notes

[FEATURES.md](../FEATURES.md) — Announcements. Distinct from [BULLETIN](./BULLETIN.md). No reply thread — two-way talk is **P1** [DISCUSSIONS](./DISCUSSIONS.md). Parent sidebar shows a red count of unacknowledged current announcements.
