# EVENT

**URL (view):** `/my/<org-slug>/events/<event_id>`  
**URL (new):** `/my/<org-slug>/events/new`  
**URL (edit):** `/my/<org-slug>/events/<event_id>/edit`  
**URL (print):** `/my/<org-slug>/events/<event_id>/print`  
**Query on new:** optional `audience=course|class`, `courseId` or `classId`, and `date=YYYY-MM-DD`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Staff Teacher view to add and edit (owner, admin, or instructor). Anyone who can already see the event can open it: families when a linked student is in a target course or class, and staff who can manage that audience.

## Purpose

One shared calendar event for several courses **or** several classes, with a place, a write-up, and optional links to course materials.


## Behavior

- Audience is **Course** or **Class**, then a multi-select of one or more targets of that kind. Arriving from a course or class starts that target selected. Staff can check more courses or more classes. One event cannot mix courses and classes.
- **Location** is required. **Starts** is required. **Ends** is optional (blank means that one day). **Start time** and **end time** are optional. On one day, the end time is at or after the start time.
- Owners and admins can pick any course or class in the org. Instructors must be able to manage every selected course. Any instructor can pick classes in the org.
- The write-up uses the same page editor as a lesson (text, files, links, video, quizzes). It is stored with the event, not as a course material.
- Staff can also link existing course materials. Course events only link materials from the selected courses.
- Saving puts the event on the calendar for people it applies to. Remove is a soft delete and takes it off every course or class it was shared with.
- Editing from any of those courses or classes edits the same event.
- Parents and staff **Parent view** can read and print. They cannot add or edit.
- **Print** opens [PRINT](./PRINT.md) for the write-up.

## Data shown

- Title, date range, start/end time when set, **location**
- Audience names (courses or classes)
- Write-up
- Linked materials (title; open the material)

## Contents

- Header: title, when, location, audience
- Write-up
- Materials list when any are linked
- **Print**, and **Edit** / **Remove** when the person can change it

## Primary actions

- Add event (staff)
- Edit
- Print
- Remove
- Open a linked material

## Links to

- [CALENDAR](./CALENDAR.md) — back, and where the event appears
- [PRINT](./PRINT.md) — print the write-up
- [MATERIAL](./MATERIAL.md) — a linked material
- [COURSE](./COURSE.md) — add or open from a course
- [CLASS](./CLASS.md) — add or open from a class
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [ANNOUNCEMENTS](./ANNOUNCEMENTS.md), [DISCUSSIONS](./DISCUSSIONS.md), [ACTIVITY](./ACTIVITY.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)

## Notes

[FEATURES.md](../FEATURES.md) — Events. No hourly grid, no repeat, no email or Activity.
