# BULLETIN

**URL (view):** `/my/<org-slug>/courses/<course_id>/bulletins/<bulletin_id>`  
**URL (new):** `/my/<org-slug>/courses/<course_id>/bulletins/new`  
**URL (edit):** `/my/<org-slug>/courses/<course_id>/bulletins/<bulletin_id>/edit`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors and org admins who can manage the course (compose). Parents and invited students (read the notice and open materials). Staff **Parent view** uses the read presentation.

## Purpose

A dated course **notice**. Teachers set when it is available and which materials sit underneath it. Families open it from home and get a page of links to those materials.

## Behavior

### View

- Load one bulletin on a course. Staff (Teacher view) can open any non-deleted bulletin for a course they can manage, including upcoming and past.
- Families (and staff **Parent view**) can open it when the course is parent-viewable **and** today (local calendar date) is in the start–end window (inclusive). Outside that window, or if removed: plain-language “this note isn’t available,” with a way back to [ORG_HOME](./ORG_HOME.md) / the course.
- Body is the optional note. Materials list is ordered links (title, kind, print). Unpublished materials are omitted for families; staff in Teacher view still see them with an unpublished badge.
- Teacher view: **Edit** and **Remove** (soft-delete, confirm). Remove is not a hard delete.

### New / edit (staff, Teacher view only)

- Title required. Optional note. **Start date** and **end date** required; end must be on or after start. New form defaults the title to `This week in <course title>` and the range to this Sunday–Saturday week.
- Pick zero or more **materials from this course** (checkboxes, top-level first then by unit). Order follows the picker’s list (course material order).
- Saving creates or updates the bulletin and replaces the attached materials.
- Date window **is** availability — no extra publish control. Families see it on home only while today is in range. Parent home cards emphasize the **course** title. Multi-student homes group by student (bulletins with that child’s work). **Print this week** prints each student’s bulletin content first, then their materials.
- Cancel returns to the course (new) or the bulletin (edit).
- Staff **Parent view** and parent-only users cannot open `/new` or `/edit` (redirect to org home).

Empty materials is allowed — the bulletin can be a note with no links.

## Data shown

- Course title (context)
- Bulletin **title**
- Optional **body**
- **Start date** and **end date** (available window)
- Availability badge for staff: available now / upcoming / ended
- Attached **materials**: title, kind, unpublished badge (staff), link into [MATERIAL](./MATERIAL.md), **Print**
- Material count on lists

Writeable on new/edit: title, body, start date, end date, which materials are attached.

## Contents

### View

- Title (display type) + date range
- Optional note
- List of material links (or a plain empty line if none)
- Back to this week (families) or back to the course (staff)
- Edit / Remove for staff Teacher view

### New / edit

- Title, note, start date, end date
- Material picker grouped as top-level then units
- Save / Cancel ([STYLE_GUIDE.md](../STYLE_GUIDE.md) settings-style header actions)

## Primary actions

- Open an attached material
- Print an attached material
- Save a bulletin (staff)
- Remove a bulletin (staff, confirm)

## Links to

- [ORG_HOME](./ORG_HOME.md) — back to this week / from parent home cards
- [COURSE](./COURSE.md) — back to the course; add bulletin from course home
- [MATERIAL](./MATERIAL.md) — each attached material
- [PRINT](./PRINT.md) — **Print** on an attached material
- Via org chrome (staff Teacher view): [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); search overlay TBD

## Notes

[FEATURES.md](../FEATURES.md) — Bulletins. Not email (P1 Notifications). Not a separate assignment object. Course-from-course does not copy bulletins.
