# AGENTS — `src/lesson-plans/`

Weekly course **lesson plans**: a Sunday–Saturday week note, optional per-day notes, optional materials per day, **published / unpublished**.

## Scope

- Course list of lesson plans + **Add lesson plan**
- Create / edit / view / publish / soft-delete
- Parent This week and Calendar show **published** plans
- View page wraps days that have a plan (empty days omitted); materials sit with that day’s text after a divider. The compose form defaults to the org’s **school days**; staff can **Add another day** via a modal of remaining weekdays. Days with notes or materials stay visible even if they are not school days. Per-day materials use **Link materials** (outline multi-select with search).

## Rules

- One non-deleted plan per course per `week_start` (Sunday).
- New plans start unpublished. Families never see unpublished plans (RLS + UI).
- Materials must belong to the same course. Families only follow **published** materials.
- Attaching a material does **not** change assignment or due dates.
- Soft-delete only. Course-from-course does **not** copy lesson plans.
- Page folders: `lesson-plan/` (view), `lesson-plan-edit/` (new + edit). Shared `model/` + `databridge/`.
- Calendar UI lives in `calendar/`; parent home composes that domain.

## Don’t

- Treat this as email (P1 Notifications) or as a separate assignment object.
- Hard-delete lesson-plan rows from the app.
- Attach materials from another course.
- Revive **bulletins** — this domain replaced them.
