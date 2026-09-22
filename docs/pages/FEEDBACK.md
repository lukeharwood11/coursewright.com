# FEEDBACK

**URL (account):** `/my/feedback`  
**URL (in an organization):** `/my/<org-slug>/feedback`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Any signed-in person (staff or parent).

## Purpose

A simple way to tell Course Wright how to make the product better. Opened from **Send feedback** in the account (profile) menu.

## Behavior

- Requires a signed-in account.
- Name, email, organization (when an org is in context), and role are filled automatically from the session and shown as read-only.
- The person writes a note and sends it. The note is stored in the `feedback` table (no email).
- From the account shell (no org), organization shows as **None selected**.
- From an org, the current organization and role are included.

## Data shown

- **Name** — `profiles.name` (read-only)
- **Email** — account email (read-only)
- **Organization** — current org name + permalink when in org chrome
- **Role** — current membership role when in an org
- **Message** — required, written by the person

## Contents

- Heading **Send feedback**
- Short explanation that identity fields come from the account
- Read-only identity fields + message
- **Send feedback**

## Primary actions

- Send the note
- Return via org/account chrome

## Links to

- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — account menu
- [ORG_PICKER](./ORG_PICKER.md) — switch organization (account chrome)
- [ORG_HOME](./ORG_HOME.md) — when opened from an org
- via org chrome (when on `/my/<org-slug>/feedback`): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)

## Notes

[FEATURES.md](../FEATURES.md) — Product feedback. Not the public [CONTACT](./CONTACT.md) page (mailto only).
