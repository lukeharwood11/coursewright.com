# AGENTS — `src/calendar/`

Month and week **calendar** of assigned/due materials and lesson plans. Course-colored chips; legend filters classes.

## Scope

- Calendar page (`/my/<org-slug>/calendar`) — month, week, and day (`?view=`)
- Shared `WeekCalendar` / `MonthCalendar` / `DayCalendar` used by parent This week (`layout="cards"` there: skip empty days, wrap remaining days)
- Assigned = outline chip; due = filled chip
- Calendar items are links; tapping a day (not an item) opens day view

## Rules

- Week is Sunday–Saturday ([FEATURES.md](../../docs/FEATURES.md)).
- Parent mode: published materials and published lesson plans for enrolled courses.
- Staff Teacher view: courses they can manage, including unpublished (draft cue).
- Databridge loads the visible range; model builds chips. Page hook owns React.

## Don’t

- Put lesson-plan authoring here — that lives in `lesson-plans/`.
- Invent a separate assignment object.
