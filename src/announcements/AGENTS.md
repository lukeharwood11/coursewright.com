# AGENTS — `src/announcements/`

One-way **announcements**: a notice to one or more courses, classes, or students (same kind). Optional start/end dates. No reply thread.

## Scope

- Org list + **New announcement** (staff Teacher view)
- Parent list of **current** announcements (same URL; parent chrome / Parent view)
- Create / edit / view / soft-delete
- Parent/student home also surfaces **current** announcements
- Opening the view page marks it **read** (clears the notification icon and sidebar unread badge)

## Rules

- Audience kind is course, class, or student; pick **one or more** targets of that kind.
- Date window **is** homepage availability — do not add a publish toggle.
- Soft-delete only. Course-from-course copy does **not** copy announcements.
- Page folders: `announcements/` (staff + parent list), `announcement/` (view), `announcement-edit/` (new + edit). Shared `model/` + `databridge/`.
- Parent home and the parent list compose this domain via `parent/` dashboard data; do not put announcement CRUD in `parent/`.
- Parent chrome shows a red unread count on **Announcements** for notices not yet opened.
- Optional **Send notification** emails `send-announcement-notification` (Resend `announcement-notification`) and writes one Activity row per claimed family account. A later send updates that row. Recipients are claimed family accounts only (not pending invites). The announcement still saves if mail fails. Sidebar unread is separate.

## Don’t

- Treat this as a bulletin (those attach materials) or a discussion thread (**P1** `discussions/`).
- Hard-delete announcement rows from the app.
- Mix audience kinds on one announcement (course + class together).
