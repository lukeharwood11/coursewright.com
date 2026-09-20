# ACTIVITY

**URL:** `/my/<org-slug>/activity`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Staff (Teacher view) and families (parent chrome / **Parent view**). Each person sees only their own notifications.

## Purpose

List stored **Activity** notifications — events that need this person’s attention — and open the matching item. Clicking a row marks it **read**.

## Behavior

- Load this org’s notifications for the signed-in person (RLS: own rows only).
- Reached from the org header **bell** → **View all activity** (the bell itself previews unread only).
- Unread first, then newest.
- Each row shows a **type icon** (discussion post vs @mention; other kinds when added) and a headline that names the activity. Unread rows use a stronger card; the icon does **not** switch to a read-receipt checkmark.
- Clicking a row **acks** it (`read_at`) and opens the activity (a discussion post). Opening the discussion another way acks matching **new post** notifications for that person. **@mentions** stay unread until clicked.
- While this page is open, **Realtime** adds new rows without a full reload.
- Empty: **Nothing here yet.**
- Staff Teacher view and parent chrome share the same list; recipients differ by who was notified (instructors / class leads by default; families when a teacher chose **Notify everyone**; anyone @mentioned on the thread).

## Data shown

- Headline by kind, e.g. **New discussion: {title} in {course/class}** or **Mentioned in {title} in {course/class}**
- **Preview** of the post
- Who posted + time
- Unread vs seen (card emphasis only — not a checkmark)

Read-only list (ack is the write).

## Contents

- Page title **Activity**
- Notification list
- Empty state: **Nothing here yet.**

## Primary actions

- Open a notification (marks it read)
- **View all activity** from the header bell

## Links to

- [DISCUSSION](./DISCUSSION.md) — open the post
- [ORG_HOME](./ORG_HOME.md) — via chrome
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); search overlay TBD
- Via parent chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md)

## Notes

[FEATURES.md](../FEATURES.md) — Notifications (**P1**). Header bell (right of the avatar) shows a red unread count and previews the three newest unread, or **You're all caught up!** Distinct from announcement unread icons and the Discussions unread-thread badge. No email or push in this slice.
