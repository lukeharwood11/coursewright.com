# AGENTS — `src/calendar/`

Month and week **calendar** of assigned/due materials, lesson plans, and shared **events**. Course-colored chips; legend filters classes. Events are a separate chip (time and location on day view).

## Scope

- Calendar page (`/my/<org-slug>/calendar`) — month, week, and day (`?view=`)
- Shared `WeekCalendar` / `MonthCalendar` / `DayCalendar` used by parent This week (`layout="cards"` there: skip empty days, wrap remaining days)
- Assigned = outline chip; due = filled chip labeled `Due: <title>` in the cell
- Calendar items are links; tapping a day (not an item) opens day view

## Rules

- Week is Sunday–Saturday ([FEATURES.md](../../docs/FEATURES.md)).
- Parent mode: published materials and published lesson plans for enrolled courses. Course and class events only when a linked student is in a target. Organization events always show — including staff Preview / Parent / Student modes. Staff **Preview** uses taught published courses instead of enrollments.
- Staff Teacher view: courses they can manage, including unpublished (draft cue).
- Databridge loads the visible range; model builds chips. Page hook owns React.

## Don’t

- Put lesson-plan authoring here — that lives in `lesson-plans/`.
- Invent a separate assignment object.
