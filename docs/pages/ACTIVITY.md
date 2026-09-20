# ACTIVITY

**URL:** `/my/<org-slug>/activity`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Staff (Teacher view) and families (parent chrome / **Parent view**). Each person sees only their own notifications.

## Purpose

List stored **Activity** notifications — discussion posts that need this person’s attention — and open the matching item. Clicking a row marks it **read**.

## Behavior

- Load this org’s notifications for the signed-in person (RLS: own rows only).
- Unread first, then newest.
- Unread rows show a notification icon and a stronger card. Opened (acked) rows show a read-receipt icon.
- Clicking a row **acks** it (`read_at`) and opens the activity (a discussion post). Opening the discussion another way also acks matching discussion notifications for that person.
- While this page is open, **Realtime** adds new rows without a full reload.
- Empty: plain language — nothing needs attention yet.
- Staff Teacher view and parent chrome share the same list; recipients differ by who was notified (instructors / class leads by default; families when a teacher chose **Notify everyone**).

## Data shown

- Discussion **title**
- **Preview** of the post
- Who posted + course or class name
- Time
- Unread vs seen

Read-only list (ack is the write).

## Contents

- Page title **Activity**
- Short line: posts that need your attention
- Notification list
- Empty state

## Primary actions

- Open a notification (marks it read)

## Links to

- [DISCUSSION](./DISCUSSION.md) — open the post
- [ORG_HOME](./ORG_HOME.md) — via chrome
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); search overlay TBD
- Via parent chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md)

## Notes

[FEATURES.md](../FEATURES.md) — Notifications (**P1**). Sidebar shows a red unread count. Distinct from announcement unread icons and the Discussions unread-thread badge. No email or push in this slice.
