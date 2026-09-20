# ANNOUNCEMENTS

**URL:** `/my/<org-slug>/announcements`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Owners, admins, and instructors (Teacher view). Parents do not use this list — they see current announcements on [ORG_HOME](./ORG_HOME.md). Staff **Parent view** redirects here away from compose; the list itself is staff-only.

## Purpose

Staff list of one-way announcements in the organization, grouped by whether families see them now.

## Behavior

- Load non-deleted announcements for the org the staff member can see (RLS).
- Group as **Available now**, **Upcoming**, and **Ended** (local calendar date vs optional start/end). Undated notices sit in **Available now** until removed.
- Each row shows title, audience (course / class / student name), and dates when set.
- Opening a row goes to [ANNOUNCEMENT](./ANNOUNCEMENT.md).
- **New announcement** goes to compose. Staff **Parent view** and parent-only users cannot open this page (redirect to org home).

Empty: plain language plus **New announcement**.

## Data shown

- Announcement **title**
- **Audience** kind + name (course title, class title, or student name)
- Optional **start date** / **end date**
- Availability grouping (available now / upcoming / ended)

## Contents

- Page title **Announcements**
- Short line: one-way notices — not a discussion, not a bulletin with materials
- Grouped list
- **New announcement**

## Primary actions

- Open an announcement
- Compose a new announcement

## Links to

- [ANNOUNCEMENT](./ANNOUNCEMENT.md) — view or new
- [ORG_HOME](./ORG_HOME.md) — back to home
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); search overlay TBD

## Notes

[FEATURES.md](../FEATURES.md) — Announcements. Distinct from [BULLETIN](./BULLETIN.md). No reply thread in this phase.
