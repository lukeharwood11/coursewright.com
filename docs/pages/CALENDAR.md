# CALENDAR

**URL:** `/my/<org-slug>/calendar`  
**Query:** `?view=month` (default), `?view=week`, or `?view=day`; `?date=YYYY-MM-DD` focuses that day (defaults to today)  
**URL map:** [URLS.md](../URLS.md)

## Audience

Parents (and staff **Parent view**) for linked students’ courses. Staff Teacher view for courses they can manage.

## Purpose

Month, week, and day view of when work is **assigned** and **due**, plus lesson-plan text on week and day views. Color-coded by course with a filterable legend.

## Behavior

- Sidebar **Calendar** for staff and parents.
- **Month** view: day cells with chips — **assigned** outlined in the course color, **due** filled. Lesson-plan text is not shown in month cells (too tight); switch to week or day to read plans. Chips and course labels open the material or lesson plan. Tapping the day (not a chip) switches to **day** view for that date.
- **Week** view: Sunday–Saturday columns. Each day, per visible course: day plan text (if any), then a divider, then that day’s lesson-plan materials **and** assigned/due materials (deduped, kept with that class). Week notes sit as a colored bar per course above the grid. Items open the material or lesson plan. Tapping the day (not an item) switches to **day** view. [ORG_HOME](./ORG_HOME.md) This week uses the same chips and notes, but **omits empty days** and wraps remaining days as cards (those day cards also open day view).
- **Day** view: that date only — **events** first (title, start/end time when set, location), then the same class blocks as week (plan text + materials). Previous / next move one day.
- **Events** are their own chips (title on month and week). A single-course event uses that course color and follows the legend. An event on several courses stays while any of those courses is visible. Class events are not hidden by the legend. Clicking an event opens [EVENT](./EVENT.md).
- Staff Teacher view: **Add event** (date filled from the day you’re looking at). Parents and Parent view do not add events.
- **Legend** lists courses with their color; tap to show/hide. Filter is client-side (this browser).
- Parents: published materials + published lesson plans on enrolled, active, published courses of **active** students (student tags are on This week; Calendar shows all linked enrolled students unless later filtered the same way — Calendar uses the same student set as the parent dashboard without collapsing tags; if the parent has multiple students, all their courses appear, color-coded).
- Staff Teacher view: courses they can manage, including unpublished lesson plans (draft styling) and unpublished dated materials.
- Empty: plain language, no LMS jargon.

## Data shown

- Month, week, or day grid for the focused date
- Course legend (title + color)
- Material chips: title; **Assigned** vs **Due**
- Event chips: title. Day view also shows start/end time and location
- Week / day view: lesson-plan week notes (week) and day text
- Unpublished / draft cue for staff

## Contents

- Header: Calendar + period label; controls split into **prev/next** (pagination) and a separate **month/week/day** view segment (icons + labels)
- Legend
- Month grid, week calendar, or day list
- Click a material → [MATERIAL](./MATERIAL.md); click a lesson plan block → [LESSON_PLAN](./LESSON_PLAN.md); click a day → this page with `?view=day`

## Primary actions

- Switch month / week / day
- Move to previous / next period
- Filter courses in the legend
- Open a material, lesson plan, or event
- **Add event** (staff Teacher view)
- Open a day

## Links to

- [ORG_HOME](./ORG_HOME.md) — This week
- [EVENT](./EVENT.md) — event chip; **Add event**
- [MATERIAL](./MATERIAL.md) — assigned/due chip
- [LESSON_PLAN](./LESSON_PLAN.md) — week plan
- [COURSE](./COURSE.md) — course from legend (staff / parent-viewable)
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)

## Notes

[FEATURES.md](../FEATURES.md) — Calendar, lesson plans, homework dates. Week = Sunday–Saturday. Assigned outline / due filled.
