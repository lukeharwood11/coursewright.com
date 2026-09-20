# CALENDAR

**URL:** `/my/<org-slug>/calendar`  
**Query:** `?view=month` (default) or `?view=week`; `?date=YYYY-MM-DD` focuses that day (defaults to today)  
**URL map:** [URLS.md](../URLS.md)

## Audience

Parents (and staff **Parent view**) for linked students’ courses. Staff Teacher view for courses they can manage.

## Purpose

Month and week view of when work is **assigned** and **due**, plus lesson-plan text on week view. Color-coded by course with a filterable legend.

## Behavior

- Sidebar **Calendar** for staff and parents.
- **Month** view: day cells with chips — **assigned** outlined in the course color, **due** filled. Lesson-plan text is not shown in month cells (too tight); switch to week to read plans.
- **Week** view: Sunday–Saturday columns. Each day, per visible course: day plan text (if any), then a divider, then that day’s lesson-plan materials **and** assigned/due materials (deduped, kept with that class). Week notes sit as a colored bar per course above the grid. [ORG_HOME](./ORG_HOME.md) This week uses the same chips and notes, but **omits empty days** and wraps **one card per class on a day** so a class’s text and materials stay together.
- **Legend** lists courses with their color; tap to show/hide. Filter is client-side (this browser).
- Parents: published materials + published lesson plans on enrolled, active, published courses of **active** students (student tags are on This week; Calendar shows all linked enrolled students unless later filtered the same way — Calendar uses the same student set as the parent dashboard without collapsing tags; if the parent has multiple students, all their courses appear, color-coded).
- Staff Teacher view: courses they can manage, including unpublished lesson plans (draft styling) and unpublished dated materials.
- Empty: plain language, no LMS jargon.

## Data shown

- Month or week grid for the focused date
- Course legend (title + color)
- Material chips: title; **Assigned** vs **Due**
- Week view: lesson-plan week notes and day text
- Unpublished / draft cue for staff

## Contents

- Header: Calendar + month/week toggle + prev/next
- Legend
- Month grid or week calendar
- Click a material → [MATERIAL](./MATERIAL.md); click a lesson plan block → [LESSON_PLAN](./LESSON_PLAN.md)

## Primary actions

- Switch month / week
- Move to previous / next period
- Filter courses in the legend
- Open a material or lesson plan

## Links to

- [ORG_HOME](./ORG_HOME.md) — This week
- [MATERIAL](./MATERIAL.md) — assigned/due chip
- [LESSON_PLAN](./LESSON_PLAN.md) — week plan
- [COURSE](./COURSE.md) — course from legend (staff / parent-viewable)
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)

## Notes

[FEATURES.md](../FEATURES.md) — Calendar, lesson plans, homework dates. Week = Sunday–Saturday. Assigned outline / due filled.
