# ORG_HOME

**URL:** `/my/<org-slug>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

All org members. **Same URL**, different chrome/content by role (owner, admin, instructor, parent).

## Purpose

Organization home / dashboard. For parents this **is** the P0 parent dashboard: **this week’s calendar** plus a **Focus** rail (Important now + Coming up). For instructors/owners/admins, an operational summary: courses, needs attention, this week across the org, and people counts — not a link grid to other sections.

## Behavior

Same URL for all roles; chrome and body switch by membership role. Owners, admins, and instructors also get a **Teacher / Parent view** toggle in org chrome. **Parent view** shows this parent dashboard (real this-week if they have linked students; otherwise a preview). Parent-only users do not see the toggle.

### Parent

- Usability bar: understand child, course, and what’s needed immediately — no LMS jargon.
- Main body is the **current Sunday–Saturday week calendar** (same week component as [CALENDAR](./CALENDAR.md) week view): lesson-plan text in each day, materials after a divider, assigned = outline / due = filled, course colors.
- **Focus** column on the right (stacks below on small screens): **Important now** and **Coming up** (**Assigned next** + **Due next**).
- When the parent has more than one student, **tags** at the top toggle who is active. Deselecting a student hides their work (calendar, Focus). One student skips the tags.
- Week notes for published lesson plans sit as a colored bar per course above the grid.
- **Print this week** prints only **active** students’ **full** week (published lesson plans first, then due and assigned materials, plus important now for their courses), **one student at a time** with a page break before the next student. Per-material **Print** stays first-class — both land on [PRINT](./PRINT.md).
- Parent org access requires linked student enrolled in a course with `status = active` **and** `visibility = published` (dates informational only).
- Progress tab is P1 (dim/inactive until then). Parent summary layer (B) is **P1**, not P0.
- Empty: no dated work and no published lesson plan this week, or not yet on an active enrollment — plain-language next step.

### Instructor / owner / admin

- Operational **dashboard** (sidebar still provides full nav, including **Calendar**). Home body summarizes the co-op; it does not only list destinations.
- **Getting started** when there are no courses and/or no students: short checklist (create course → add students → enroll / publish). Create → print does **not** require a roster.
- **Needs attention** (only when non-empty): active courses with zero enrollments; unpublished courses that already have enrollments; active courses with enrollments but no dated materials in the current week.
- **Courses**: compact preview cards (title, icon, subject, published/status, enrollment count), up to six, plus link to [COURSE_LIST](./COURSE_LIST.md). Primary **Create course**.
- **This week**: week label; org-wide **Important now**; per active course dated-material counts for the Sunday–Saturday week (staff sees active materials, including unpublished).
- **People**: student + class counts → [ORG_ROSTER](./ORG_ROSTER.md).
- Switch org returns to org picker.
- **Teacher / Parent view** in the header: Parent view swaps this dashboard for the parent home (and parent chrome). Staff-only pages (roster, course list, settings) return here while Parent view is on.
- **Search** in product chrome (staff, Teacher view): Postgres FTS for courses and materials, plus staff pages by title; overlay only; dedicated route still TBD.
- **P1:** templates in chrome.

## Data shown

### Parent

- Org **name**
- Week range label (Sun–Sat dates)
- **Student tags** when more than one linked student (active / inactive)
- Week calendar: per day, per visible course — day plan text; divider; lesson-plan materials and assigned/due materials (title; **Assigned** outline / **Due** filled; course color)
- Published lesson-plan **week notes** as course-colored bars above the grid
- **Focus:** Important now (material title, description when set, course/student context); Coming up Assigned next / Due next
- Print affordances (not data fields)

### Instructor / owner / admin

- Org **name** + current week label
- Setup flags: needs course / needs students
- Attention rows: course title + reason
- Course previews: title, icon, subject, status, visibility, active enrollment count
- This week: important-now (material title, description when set, course title); dated material counts by course
- People: student count, class count

## Contents

### Parent view (usability anchor)

Tech-averse parents must understand what’s going on immediately — which child, what materials, what’s due.

- Top: org context + account affordance ([STYLE_GUIDE.md](../STYLE_GUIDE.md) parent pattern) → [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)
- Desktop: simpler collapsible sidebar (This week, Calendar, their courses, Progress). Body uses remaining width — not a centered narrow column.
- Greeting + **current calendar week** (Sunday–Saturday) + **Print this week**
- **Student tags** (multi-student parents only) — tap to include/exclude a student
- Two columns on large screens: **week calendar** | **Focus** (Important now + Coming up). Stacks on small screens (calendar first).
- Course legend on the week calendar (same as [CALENDAR](./CALENDAR.md)) so families can hide a class
- Bottom tabs concept: This week | Progress (Progress **P1** — dim/inactive until then)
- Links into material / lesson plan / course in the same URL tree (simpler chrome)

**Empty states**

- No dated work and no published lesson plan this week — plain language, no LMS jargon
- Not yet linked to an active enrollment — explain next step (invite / wait for roster)

### Instructor / owner / admin view

- Collapsible **org sidebar** for Home, Calendar, Courses, Roster (nested class names when they exist), Settings (course names nested when present)
- Header: org name, week label, **Create course**
- **Teacher / Parent view** (staff only) in org chrome
- Getting started (when needed)
- Needs attention (when needed)
- Courses preview + View all
- This week (important now + dated counts)
- People snapshot (roster)
- Switch org → [ORG_PICKER](./ORG_PICKER.md)
- Account menu (avatar) → User (Settings / Sign out) and Organization (Org settings / Switch → [ORG_PICKER](./ORG_PICKER.md)) — [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md), [ORG_SETTINGS](./ORG_SETTINGS.md)
- **Search** in chrome (staff overlay: pages / courses / materials; dedicated route TBD)

## Primary actions

### Parent

- Print this week (active students)
- Toggle which students are active (when more than one)
- Filter courses on the week calendar legend
- Open / print a material
- Open a lesson plan from the week calendar
- Open assigned-next / due-next / important-now items

### Instructor / owner / admin

- Create / open course
- Open attention targets (course or course roster)
- Open roster / settings / calendar
- Search org pages, courses, materials
- Switch **Teacher / Parent view** (header)

## Links to

### Parent

- [MATERIAL](./MATERIAL.md) — open a this-week / important-now item
- [LESSON_PLAN](./LESSON_PLAN.md) — open a published lesson plan
- [CALENDAR](./CALENDAR.md) — month/week calendar in the sidebar
- [UNIT](./UNIT.md) — open a unit when linked from materials
- [COURSE](./COURSE.md) — open course context (read-focused)
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — account affordance
- [ORG_PICKER](./ORG_PICKER.md) — switch org (when multi-org)
- [PRINT](./PRINT.md) — **Print this week** → `/my/<org-slug>/print-this-week`; per-material **Print** → material `…/print`

### Instructor / owner / admin

- [COURSE](./COURSE.md) — open a course (preview or this-week row)
- [CALENDAR](./CALENDAR.md) — month/week calendar
- [COURSE_ROSTER](./COURSE_ROSTER.md) — from “no enrollments” attention
- [COURSE_LIST](./COURSE_LIST.md) — view all / create course
- [MATERIAL](./MATERIAL.md) — important-now item
- [ORG_ROSTER](./ORG_ROSTER.md) — people / students
- [ORG_SETTINGS](./ORG_SETTINGS.md) — via chrome / account menu
- [ORG_PICKER](./ORG_PICKER.md) — switch org
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — account
- Search — staff chrome overlay (pages / courses / materials); dedicated route still TBD
- **P1:** [TEMPLATE_LIST](./TEMPLATE_LIST.md) — templates

## Notes

[FEATURES.md](../FEATURES.md) — Parent experience, units/dating, important now, **lesson plans**, calendar, print grain, RBAC, advanced search. Parent summary layer is **P1**, not P0. Homework in P0 = dated materials on the week calendar (no separate assignment object). Staff home is an operational dashboard (attention + course previews + this week + people), not a nav tile grid.
