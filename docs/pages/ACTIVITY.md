# ACTIVITY

**URL:** `/my/<org-slug>/activity`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Staff (Teacher view) and students (student chrome / **Student view**). Each person sees only their own notifications.

## Purpose

List stored **Activity** notifications — events that need this person’s attention — and open the matching item. Clicking a row marks it **read**.

## Behavior

- Load this org’s notifications for the signed-in person (RLS: own rows only).
- Reached from the org header **bell** → **View all activity** (the bell itself previews unread only).
- Unread first, then newest.
- Each row shows a **type icon** (discussion post, @mention, announcement, or report card) and a headline that names the activity. Unread rows use a stronger card; the icon does **not** switch to a read-receipt checkmark.
- Clicking a row **acks** it (`read_at`) and opens the activity (a discussion post, an announcement, or a sent report card). Opening the discussion another way acks matching **new post** notifications for that person. Opening the announcement acks matching **announcement** notifications. **@mentions** stay unread until clicked. A device-notification tap marks that one row read, including an @mention.
- While this page is open, **Realtime** adds new rows without a full reload.
- Empty: **Nothing here yet.**
- Staff Teacher view and student chrome share the same list; recipients differ by who was notified (instructors / class leads, people who started or posted on the thread, students when a teacher chose **Notify everyone**, anyone @mentioned, students when staff chose **Send notification** on an announcement). One new-post Activity item per discussion. One announcement Activity item per notice.

## Data shown

- Headline by kind, e.g. **New discussion: {title} in {course/class}**, **Mentioned in {title} in {course/class}**, **Announcement: {title} in {audience}**, or **Report card in {course}**
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
- [ANNOUNCEMENT](./ANNOUNCEMENT.md) — open the notice
- [REPORT_CARD](./REPORT_CARD.md) — open a sent report card
- [ORG_HOME](./ORG_HOME.md) — via chrome
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); search overlay TBD
- Via student chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [PROGRESS](./PROGRESS.md), [RESOURCES](./RESOURCES.md) (when visible), [ACTIVITY](./ACTIVITY.md)

## Notes

[FEATURES.md](../FEATURES.md) — Notifications (**P1**). Header bell (right of the avatar) shows a red unread count and previews the three newest unread, or **You're all caught up!** Distinct from announcement sidebar unread and the Discussions unread-thread badge. Announcement **Send notification** also writes an Activity row. The installed app can turn on a device notification for the same rows ([ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)). A browser tab does not.
