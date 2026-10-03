# LESSON_PLAN

**URL (view):** `/my/<org-slug>/courses/<course_id>/lesson-plans/<lesson_plan_id>`  
**URL (new):** `/my/<org-slug>/courses/<course_id>/lesson-plans/new` (`?week=` optional Sunday `YYYY-MM-DD`)  
**URL (edit):** `/my/<org-slug>/courses/<course_id>/lesson-plans/<lesson_plan_id>/edit`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors and org admins who can manage the course (compose / publish). Students (and staff **Student view**) read a **published** plan for a student-viewable course.

## Purpose

A weekly course plan: optional whole-week note, optional notes, materials, and course-linked Resources for each day of Sunday–Saturday. Replaces bulletins.

## Behavior

- Load one lesson plan on a course. Staff (Teacher view) can open any non-deleted plan for a course they can manage, including unpublished.
- Students (and staff **Student view**) can open it when the course is student-viewable **and** the plan is **published**. Unpublished: plain-language “this plan isn’t ready yet,” with a way back to [ORG_HOME](./ORG_HOME.md) / the course.
- New form defaults the title to `This week in <course title>` and the week to the current Sunday–Saturday week (`?week=` overrides). If that week already has a plan, **new** redirects to **edit**.
- Compose form: week picker, title, week-note field, then **wrapping day cards** (same width as This week — about two or three across, stacked on a phone). Cards default to the org’s **school days**. An **Add another day** button opens a modal listing remaining weekdays in that Sunday–Saturday week as large day buttons. Days that already have text, materials, or resources stay on the form even if they are not school days. Each day: optional text + **Link materials** (modal: course outline multi-select with search; linked materials show as removable rows on the card) + **Link resources** (modal: only Resources this course already links, including what sits inside a linked folder; multi-select with search on name or folder path). A folder row is that folder, not every child. Selected resources are removable rows and show the same family-access warning as the course page. Linking a resource on the day does not grant access.
- Saving creates or updates the plan and replaces per-day materials and resource links, in picker order. Empty days (no text, no materials, no resources) are not stored. A day with only resources is kept.
- **Published / unpublished** like materials: new plans start unpublished; amber banner + Publish; published shows a green badge; Unpublish at the bottom of view/edit.
- Attaching a material does not change assignment or due dates. Unpublished materials stay hidden from students.
- A day can link an org Resource only when this course already links it, or it sits inside a folder this course links (including a nested folder). The picker is not the whole Resources library. The warning is display-only. Resource visibility is unchanged.
- Cancel returns to the course (new) or the plan (edit). Soft-delete with confirm (staff).

## Data shown

- Lesson plan **title**
- **Week** (Sunday–Saturday label)
- Optional **week note**
- Per day **that has a plan**: weekday + date, optional plan text, attached materials (title; unpublished flag for staff), then linked resources (folder or item title; staff see the family-access warning). Days with no text, no materials, and no resources are omitted. A hidden resource is not shown as a placeholder.
- **Visibility**
- Course title

## Contents

- Header: title, week badge, course, Published badge when published
- Staff: Edit / Remove; Publish banner when unpublished
- Week note (if any)
- Wrapping day cards (read-only on view, empty days omitted; textareas + link materials + link resources on edit for school days plus any added or already-filled days)
- Unpublish control at the bottom when published (staff)

## Primary actions

- Save a lesson plan (staff)
- Publish / unpublish (staff)
- Remove a lesson plan (staff, confirm)

## Links to

- [ORG_HOME](./ORG_HOME.md) — back to this week (students)
- [CALENDAR](./CALENDAR.md) — week/month calendar
- [COURSE](./COURSE.md) — back to the course; add lesson plan from course home
- [MATERIAL](./MATERIAL.md) — open an attached material
- [RESOURCES](./RESOURCES.md) — open a linked resource or folder
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [CALENDAR](./CALENDAR.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)

## Notes

[FEATURES.md](../FEATURES.md) — Lesson plans. Not email (P1 Notifications). Not a separate assignment object. Course-from-course does not copy lesson plans. Replaces bulletins.
