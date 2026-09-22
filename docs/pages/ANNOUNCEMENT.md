# ANNOUNCEMENT

**URL (view):** `/my/<org-slug>/announcements/<announcement_id>`  
**URL (new):** `/my/<org-slug>/announcements/new`  
**URL (edit):** `/my/<org-slug>/announcements/<announcement_id>/edit`  
**URL map:** [URLS.md](../URLS.md)

Optional query on **new:** `audience=course|class|student` plus `courseId`, `classId`, or `studentId` when composing from a course, class, or student profile.

## Audience

Staff compose (owners, admins, instructors in Teacher view). Parents and invited students read a notice that applies to them. Staff **Parent view** uses the read presentation; opening it still marks the notice read for that person.

## Purpose

A **one-way** notice to one or more courses, classes, or students (same kind). Families open it from home or [ANNOUNCEMENTS](./ANNOUNCEMENTS.md). There is no reply thread — two-way talk is **P1** [DISCUSSION](./DISCUSSION.md).

## Behavior

### View

- Load one announcement. Staff (Teacher view) can open any non-deleted announcement in the org, including upcoming and ended.
- Families (and staff **Parent view**) can open it when it applies to a linked student **and** it is current (today in the optional start–end window; no dates means current until removed). Outside that window, or if removed: plain-language “this note isn’t available,” with a way back to [ANNOUNCEMENTS](./ANNOUNCEMENTS.md).
- Opening the page as a family (or Parent view) **marks it read** for the signed-in person, removes the **notification icon** on home / the list, shows a **read receipt** on acked rows, and decrements the sidebar unread badge. Two parents each have their own read state.
- Body is the optional note. No materials list. No comments.
- Audience shows a truncated summary (e.g. `Grade 5, Grade 6 and 2 others`). More than one target expands to list every course, class, or student.
- Teacher view: **Edit** and **Remove** (soft-delete, confirm).

### New / edit (staff, Teacher view only)

- **Audience** required: course, class, or student — pick the kind, then **multi-select** one or more targets of that kind. Prefill from the query string when arriving from a course, class, or student page (that target starts selected).
- Instructors pick **courses they teach**, or **classes / students** they can already see on the roster. Owners and admins can pick any audience in the org.
- Title required. Optional note. Optional **start date** and **end date**; if both are set, end must be on or after start. Blank dates mean the notice stays on home until removed.
- **Post announcement** stays disabled until there is a title and at least one audience target.
- Optional **Send notification** (off by default). When on at save, email families who already have an account and add one Activity row for each of them. A later send updates that row. Pending invites are not mailed. The announcement still saves if email fails. Sidebar unread still applies even when this is off.
- Date window **is** homepage availability — no extra publish control.
- Cancel returns to the list (new) or the announcement (edit).
- Staff **Parent view** and parent-only users cannot open `/new` or `/edit` (redirect to org home).

## Data shown

- **Title**
- Optional **body**
- **Audience** kind + truncated target summary (expand to all names when there is more than one)
- **Author** (who posted it)
- **Posted** date (when staff created it)
- Optional **start date** and **end date**
- Availability badge for staff: available now / upcoming / ended
- Unread vs read is shown on the home and announcements **list** (notification vs read-receipt icons), not on the view page itself

Writeable on new/edit: audience (new only), targets (new only), title, body, start date, end date, send notification (not stored).

## Contents

### View

- Title (display type) + audience badge + truncated target summary (dropdown lists all names) + author + posted date + dates when set
- Optional note (omitted entirely when blank — no placeholder copy)
- Back to announcements (families and staff)
- Edit / Remove for staff Teacher view

### New / edit

- Audience picker (course / class / student + matching multi-select checklist)
- Title, note, optional start date, optional end date
- **Send notification** toggle
- Save / Cancel ([STYLE_GUIDE.md](../STYLE_GUIDE.md) settings-style header actions)

## Primary actions

- Read the notice (marks read for families)
- Save an announcement (staff)
- Remove an announcement (staff, confirm)

## Links to

- [ORG_HOME](./ORG_HOME.md) — from parent home cards
- [ANNOUNCEMENTS](./ANNOUNCEMENTS.md) — list; cancel from new; back from view
- [COURSE](./COURSE.md) — compose entry from a course (`?audience=course&courseId=`)
- [CLASS](./CLASS.md) — compose entry from a class
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — compose entry from a student
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); search overlay TBD
- Via parent chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [RESOURCES](./RESOURCES.md) (when visible), [ACTIVITY](./ACTIVITY.md)

## Notes

[FEATURES.md](../FEATURES.md) — Announcements. Not a bulletin. Optional **Send notification** email. No discussion thread on this screen — two-way talk is **P1** [DISCUSSION](./DISCUSSION.md).
