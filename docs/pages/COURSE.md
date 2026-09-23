# COURSE

**URL:** `/my/<org-slug>/courses/<course_id>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors (builder). Admins as needed. Parents: read-focused variant of the same tree (simpler chrome).

## Purpose

Course builder home — structure units/materials for this offering; jump to roster and settings.


## Behavior

- Loads one course instance; instructor chrome for builders, simpler read chrome for parents (including staff **Parent view**).
- Browse **top-level materials** (no unit) **above** ordered units when any exist. **Add material** is on the unit (not at course top level).
- Optional **outline** panel (file-tree of top-level materials + units with nested materials and quizzes); open by default on large screens (`lg`+), closed on smaller screens; **Show outline** / hide so it is not always open.
- Add unit / add material **into a unit** when permitted.
- **Lesson plans:** staff list weekly plans on this course; **Add lesson plan** → [LESSON_PLAN](./LESSON_PLAN.md) new. Opening a row goes to the plan. Families see **published** plans only. An info icon next to the heading explains what a lesson plan is.
- **Create Announcement:** staff toolbar on this page posts a one-way [ANNOUNCEMENT](./ANNOUNCEMENT.md) to this course (`…/announcements/new?audience=course&courseId=`). On small screens this action lives under the header **More** menu.
- **Events:** list of events for this course (when, location). **Add event** starts a course event with this course selected. A course event stays on this one course. Opening a row goes to [EVENT](./EVENT.md). Families see events they can already open.
- **Start a discussion** (**P1**): same course as the audience (`…/discussions/new?audience=course&courseId=`). Families on the parent variant can start one when their child is enrolled (active + published). On small screens this action lives under **More**.
- Course Share / Duplicate live under the header **More** menu (plus discussion / announcement / settings on small screens). Print stays on materials and units.
- Instructors can **publish / unpublish** the course (distinct from archive). Unpublished courses show an amber warning + Publish on this page. Published courses show a green **Published** badge by the title; **Unpublish** lives in [COURSE_SETTINGS](./COURSE_SETTINGS.md).
- Soft-delete / versioning entry points for dangerous actions (UX TBD).
- **P0:** no template linkage UI. Optional “created from course …” origin is informational only (no sync).
- **P1:** template-linked courses show linkage; promote / sync / override cues.

## Data shown

- Course **title**, optional **description**, **location**, **subject / area**, **status**, **visibility**, optional **dates**, **grade metadata**
- **Top-level materials** (title, description, kind/badge, dates, print)
- Ordered **units** (name, optional date range, material counts TBD)
- Materials under units: **title**, **description**, kind/badge, dates, print affordance
- **Outline** (when shown): same units/materials as a compact tree (titles + kind icons); links to unit/material pages
- **Instructors** (sidebar)
- **Lesson plans** (title, week range, published/unpublished for staff; published only for families)
- **Events** for this course (title, when, location)
- Parent variant: same structure without edit controls; **unpublished courses 404**; **unpublished materials are omitted**; only **published** lesson plans

## Contents

- Course title; badges for status, published (green check) / unpublished, dates, subject / area, **grade metadata in one pill** (comma-separated, org scheme order)
- Optional description and location under the title
- Unpublished warning + Publish (instructors); published courses have no visibility banner here
- Collapsible **outline** (left on large screens): tree of top-level materials and units → materials; links open [UNIT](./UNIT.md) / [MATERIAL](./MATERIAL.md)
- Top-level materials list (above units) with **title**, **description**, kind, **Print** when any exist; add material into a unit
- Units list (ordered) → [UNIT](./UNIT.md); add unit
- Materials under units: **title**, **description**, kind/badge, dates, print affordance
- Sidebar / secondary: teachers, link to [COURSE_ROSTER](./COURSE_ROSTER.md)
- Actions: Add unit then **Add material** (page · link · file) on the unit, **Add lesson plan**, Create Announcement / **Start a discussion** (**P1**) / Settings (header on `md+`; those three also under **More** on small screens), **More** menu (Share / Duplicate), Print entry points; **Create course from this course** (copy → new independent course)
- Versioning / soft-delete awareness for dangerous actions (TBD exact UX)

## Primary actions

- Add / open unit or material
- Add / open a lesson plan
- Add / open an event
- Create Announcement
- Start a discussion (**P1**)
- Open roster / settings
- Publish / unpublish the course (instructors)
- Print unit or material (never buried)
- Create course from this course (copy)
- Share resource link (account required for recipients in P0)

## Parent variant

- Same URL tree; fewer edit controls; print still obvious; no builder clutter
- Unpublished courses are not visible (same URL 404s)
- Staff **Parent view** uses this variant (unpublished materials omitted; no edit)
- Parent/student home tags do not apply here — this page is one course
- **Start a discussion** (**P1**) for this course when the child is enrolled

## Links to

- [UNIT](./UNIT.md) — open / add unit
- [MATERIAL](./MATERIAL.md) — open material from unit rows
- [QUIZ](./QUIZ.md) — open a quiz from the unit outline
- [LESSON_PLAN](./LESSON_PLAN.md) — open / add lesson plan
- [EVENT](./EVENT.md) — open / add an event for this course
- [ANNOUNCEMENT](./ANNOUNCEMENT.md) — Create Announcement for this course
- [DISCUSSION](./DISCUSSION.md) — Start a discussion for this course (**P1**)
- [CALENDAR](./CALENDAR.md) — via org chrome
- [PRINT](./PRINT.md) — **Print** on materials / **Print unit** entry points
- [USER_PROFILE](./USER_PROFILE.md) — teachers in the sidebar
- [COURSE_ROSTER](./COURSE_ROSTER.md) — course roster
- [COURSE_SETTINGS](./COURSE_SETTINGS.md) — course settings
- [COURSE_LIST](./COURSE_LIST.md) — after create-from-course lands on new course / list
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD
- **P1:** [TEMPLATE](./TEMPLATE.md) — linked template / promote target

## Notes

[FEATURES.md](../FEATURES.md) — Course builder, units, materials, create-from-course, extreme shareability. Create → print does not require a roster. **Print whole course** is out of scope (print lives on material / unit / parent this week). Templates = **P1**.
