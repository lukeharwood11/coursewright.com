# ANNOUNCEMENT

**URL (view):** `/my/<org-slug>/announcements/<announcement_id>`  
**URL (new):** `/my/<org-slug>/announcements/new`  
**URL (edit):** `/my/<org-slug>/announcements/<announcement_id>/edit`  
**URL map:** [URLS.md](../URLS.md)

Optional query on **new:** `audience=course|class|student` plus `courseId`, `classId`, or `studentId` when composing from a course, class, or student profile.

## Audience

Staff compose (owners, admins, instructors in Teacher view). Parents and invited students read a notice that applies to them. Staff **Parent view** uses the read presentation; opening it still marks the notice read for that person.

## Purpose

A **one-way** notice to a course, a class, or a student. Families open it from home. There is no reply thread.

## Behavior

### View

- Load one announcement. Staff (Teacher view) can open any non-deleted announcement in the org, including upcoming and ended.
- Families (and staff **Parent view**) can open it when it applies to a linked student **and** it is current (today in the optional start–end window; no dates means current until removed). Outside that window, or if removed: plain-language “this note isn’t available,” with a way back to [ORG_HOME](./ORG_HOME.md).
- Opening the page as a family (or Parent view) **marks it read** for the signed-in person and removes the notification icon on home. Two parents each have their own read state.
- Body is the optional note. No materials list. No comments.
- Teacher view: **Edit** and **Remove** (soft-delete, confirm).

### New / edit (staff, Teacher view only)

- **Audience** required: course, class, or student — exactly one. Prefill from the query string when arriving from a course, class, or student page.
- Instructors pick a **course they teach**, or a **class / student** they can already see on the roster. Owners and admins can pick any audience in the org.
- Title required. Optional note. Optional **start date** and **end date**; if both are set, end must be on or after start. Blank dates mean the notice stays on home until removed.
- Date window **is** homepage availability — no extra publish control.
- Cancel returns to the list (new) or the announcement (edit).
- Staff **Parent view** and parent-only users cannot open `/new` or `/edit` (redirect to org home).

## Data shown

- **Title**
- Optional **body**
- **Audience** kind + name
- Optional **start date** and **end date**
- Availability badge for staff: available now / upcoming / ended
- Unread vs read is **not** shown on the view page itself (the home card owned that)

Writeable on new/edit: audience (new only), title, body, start date, end date.

## Contents

### View

- Title (display type) + audience badge + dates when set
- Optional note
- Back to this week (families) or back to announcements (staff)
- Edit / Remove for staff Teacher view

### New / edit

- Audience picker (course / class / student + matching select)
- Title, note, optional start date, optional end date
- Save / Cancel ([STYLE_GUIDE.md](../STYLE_GUIDE.md) settings-style header actions)

## Primary actions

- Read the notice (marks read for families)
- Save an announcement (staff)
- Remove an announcement (staff, confirm)

## Links to

- [ORG_HOME](./ORG_HOME.md) — back to this week / from parent home cards
- [ANNOUNCEMENTS](./ANNOUNCEMENTS.md) — staff list; cancel from new
- [COURSE](./COURSE.md) — compose entry from a course (`?audience=course&courseId=`)
- [CLASS](./CLASS.md) — compose entry from a class
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — compose entry from a student
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); search overlay TBD

## Notes

[FEATURES.md](../FEATURES.md) — Announcements. Not a bulletin. Not email (P1 Notifications). No discussion thread in this phase.
