# LESSON_PLAN

**URL (view):** `/my/<org-slug>/courses/<course_id>/lesson-plans/<lesson_plan_id>`  
**URL (new):** `/my/<org-slug>/courses/<course_id>/lesson-plans/new` (`?week=` optional Sunday `YYYY-MM-DD`)  
**URL (edit):** `/my/<org-slug>/courses/<course_id>/lesson-plans/<lesson_plan_id>/edit`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors and org admins who can manage the course (compose / publish). Families (and staff **Parent view**) read a **published** plan for a parent-viewable course.

## Purpose

A weekly course plan: optional whole-week note, optional notes and materials for each day of Sunday–Saturday. Replaces bulletins.

## Behavior

- Load one lesson plan on a course. Staff (Teacher view) can open any non-deleted plan for a course they can manage, including unpublished.
- Families (and staff **Parent view**) can open it when the course is parent-viewable **and** the plan is **published**. Unpublished: plain-language “this plan isn’t ready yet,” with a way back to [ORG_HOME](./ORG_HOME.md) / the course.
- New form defaults the title to `This week in <course title>` and the week to the current Sunday–Saturday week (`?week=` overrides). If that week already has a plan, **new** redirects to **edit**.
- Compose form looks like a **week calendar**: week picker, title, week-note field, then seven day columns (stacked cards on a phone). Each day: optional text + material checkboxes (same course).
- Saving creates or updates the plan and replaces per-day materials. Empty days (no text, no materials) are not stored.
- **Published / unpublished** like materials: new plans start unpublished; amber banner + Publish; published shows a green badge; Unpublish at the bottom of view/edit.
- Attaching a material does not change assignment or due dates. Unpublished materials stay hidden from families.
- Cancel returns to the course (new) or the plan (edit). Soft-delete with confirm (staff).

## Data shown

- Lesson plan **title**
- **Week** (Sunday–Saturday label)
- Optional **week note**
- Per day: weekday + date, optional plan text, attached materials (title; unpublished flag for staff) after a divider
- **Visibility**
- Course title

## Contents

- Header: title, week badge, course, Published badge when published
- Staff: Edit / Remove; Publish banner when unpublished
- Week note (if any)
- Week grid of days (read-only on view; textareas + pickers on edit)
- Unpublish control at the bottom when published (staff)

## Primary actions

- Save a lesson plan (staff)
- Publish / unpublish (staff)
- Remove a lesson plan (staff, confirm)

## Links to

- [ORG_HOME](./ORG_HOME.md) — back to this week (families)
- [CALENDAR](./CALENDAR.md) — week/month calendar
- [COURSE](./COURSE.md) — back to the course; add lesson plan from course home
- [MATERIAL](./MATERIAL.md) — open an attached material
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)

## Notes

[FEATURES.md](../FEATURES.md) — Lesson plans. Not email (P1 Notifications). Not a separate assignment object. Course-from-course does not copy lesson plans. Replaces bulletins.
