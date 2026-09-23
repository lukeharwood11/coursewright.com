# ORG_HOME

**URL:** `/my/<org-slug>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

All org members. **Same URL**, different chrome/content by role (owner, admin, instructor, parent).

## Purpose

Organization home / dashboard. For the student experience this **is** the P0 home: **this week’s calendar** plus a **Focus** rail (Important now + Coming up). For instructors/owners/admins, an operational summary: courses, needs attention, this week across the org, and people counts — not a link grid to other sections.

## Behavior

Same URL for all roles; chrome and body switch by membership role. Owners, admins, and instructors also get a **Teacher / Student view** toggle in org chrome. **Student view** shows this student home (real this-week if they have linked students; otherwise a preview). Parent-only users do not see the toggle.

### Student

- Usability bar: understand child, course, and what’s needed immediately — no LMS jargon.
- **Current announcements** sit above the week calendar when any apply. Unread cards show a notification icon; opening one marks it read.
- Main body is the **current Sunday–Saturday week** (same chips, colors, and week notes as [CALENDAR](./CALENDAR.md)): days with work are **cards** that wrap (about two or three across). Empty days are omitted. One card per day: **events** for the active students, including organization events (title chip), then each class’s plan text and its linked materials stay together inside that card (after a divider), assigned = outline / due = filled, course colors. An event-only day still shows.
- **Focus** column on the right (stacks below on small screens): **Important now** and **Coming up** (**Assigned next** + **Due next**).
- When more than one student is linked, **tags** at the top toggle who is active. Deselecting a student hides their work (calendar, Focus, announcements). One student skips the tags.
- Week notes for published lesson plans sit as a colored bar per course above the grid.
- **Print this week** prints only **active** students’ **full** week (published lesson plans first, then due and assigned materials, plus important now for their courses), **one student at a time** with a page break before the next student. Per-material **Print** stays first-class — both land on [PRINT](./PRINT.md).
- Parent org access requires linked student enrolled in a course with `status = active` **and** `visibility = published` (dates informational only).
- Parent summary layer / Progress (B) is **P1**, not P0 — not in chrome until then.
- Empty: no dated work and no published lesson plan this week, or not yet on an active enrollment — plain-language next step. Class/student announcements can still show without an enrollment.

### Instructor / owner / admin

- Operational **dashboard** (sidebar still provides full nav, including **Calendar**). Home body summarizes the co-op; it does not only list destinations.
- **Getting started** when there are no courses and/or no students: short checklist (create course → add students → enroll / publish). Create → print does **not** require a roster.
- **Needs attention** (only when non-empty): active courses with zero enrollments; unpublished courses that already have enrollments.
- **Courses**: compact preview cards (title, icon, subject, published/status, enrollment count), up to six, plus link to [COURSE_LIST](./COURSE_LIST.md). Instructors see courses they teach (and published courses they parent in). Primary **Create course**.
- **This week**: week label; **Important now** and dated-material counts for courses they can see (staff sees those materials, including unpublished).
- **People**: student + class counts → [ORG_ROSTER](./ORG_ROSTER.md).
- Switch org returns to org picker.
- **Teacher / Student view** in the header: Student view swaps this dashboard for the student home (and student chrome). Staff-only pages (roster, settings) return here while Student view is on; **Courses** stays available as the family list.
- **Search** in product chrome (staff, Teacher view): Postgres FTS for courses and materials, plus staff pages by title; overlay only; dedicated route still TBD.
- **P1:** templates in chrome.

## Data shown

### Student

- Org **name**
- Optional **About this organization** (about, address, website, contact email, phone) when any profile field is set
- Week range label (Sun–Sat dates)
- **Student tags** when more than one linked student (active / inactive)
- **Announcements:** current one-way notices (title, optional note excerpt, audience name, dates when set). Unread items show a **notification icon**. Courses of active students, classes the child is in, or that student. Student tags filter which notices show. Class/student announcements can still appear when the child has no course enrollment.
- Week calendar: **cards** for days that have a plan or assigned/due work (empty days omitted; cards wrap instead of a squeezed seven-column row). Per visible course — day plan text; divider; that class’s lesson-plan materials and assigned/due materials (title; **Assigned** outline / **Due** filled; course color)
- Published lesson-plan **week notes** as course-colored bars above the grid
- **Focus:** Important now (material title, description when set, course/student context); Coming up Assigned next / Due next
- Print affordances (not data fields)

### Instructor / owner / admin

- Org **name** + current week label
- Optional **About this organization** when profile fields are set
- Setup flags: needs course / needs students
- Attention rows: course title + reason
- Course previews: title, icon, subject, status, visibility, active enrollment count
- This week: important-now (material title, description when set, course title); dated material counts by course
- People: student count, class count

## Contents

### Student view (usability anchor)

Tech-averse parents must understand what’s going on immediately — which child, what materials, what’s due.

- Top: org context + account affordance ([STYLE_GUIDE.md](../STYLE_GUIDE.md) parent pattern) → [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); **Activity** bell to the right of the avatar → [ACTIVITY](./ACTIVITY.md)
- Desktop: simpler collapsible sidebar (This week, Calendar, Announcements, Discussions (**P1**), their courses). Body uses remaining width — not a centered narrow column.
- Greeting + **current calendar week** (Sunday–Saturday) + **Print this week**
- **About this organization** (when profile fields are set on [ORG_SETTINGS](./ORG_SETTINGS.md))
- **Student tags** (multi-student parents only) — tap to include/exclude a student
- **Announcements** — current one-way notices (when any). Unread cards show a notification icon; opening [ANNOUNCEMENT](./ANNOUNCEMENT.md) marks it read. Above the week calendar.
- Two columns on large screens: **week cards** | **Focus** (Important now + Coming up). Stacks on small screens (calendar first). Day cards wrap so two or three fit across instead of seven skinny columns.
- Course legend on the week calendar (same as [CALENDAR](./CALENDAR.md)) so students can hide a class
- Links into material / lesson plan / course in the same URL tree (simpler chrome)

**Empty states**

- No dated work and no published lesson plan this week — plain language, no LMS jargon
- Not yet linked to an active enrollment — explain next step (invite / wait for roster)

### Instructor / owner / admin view

- Collapsible **org sidebar** for Home, Calendar, Announcements, Discussions (**P1**), Courses, Roster (nested class names when they exist), Settings (course names nested when present)
- Header: org name, week label, **Create course**; **Activity** bell (right of the avatar)
- **About this organization** when profile fields are set
- **Teacher / Student view** (staff only) in org chrome
- Getting started (when needed)
- Needs attention (when needed)
- Courses preview + View all
- This week (important now + dated counts)
- People snapshot (roster)
- Switch org → [ORG_PICKER](./ORG_PICKER.md)
- Account menu (avatar) → User (Settings / **Send feedback** / Sign out) and Organization (Org settings / Switch → [ORG_PICKER](./ORG_PICKER.md)) — [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md), [FEEDBACK](./FEEDBACK.md), [ORG_SETTINGS](./ORG_SETTINGS.md)
- **Search** in chrome (staff overlay: pages / courses / materials; dedicated route TBD)

## Primary actions

### Student

- Print this week (active students)
- Toggle which students are active (when more than one)
- Filter courses on the week calendar legend
- Open / print a material
- Open a lesson plan from the week calendar
- Open an announcement (marks it read)
- Open discussions from the sidebar (**P1**)
- Open Activity from the header bell (**P1**)
- Open assigned-next / due-next / important-now items

### Instructor / owner / admin

- Create / open course
- Open attention targets (course or course roster)
- Open roster / settings / calendar
- Search org pages, courses, materials
- Switch **Teacher / Student view** (header)

## Links to

### Student

- [MATERIAL](./MATERIAL.md) — open a this-week / important-now item
- [ANNOUNCEMENT](./ANNOUNCEMENT.md) — open a current announcement
- [DISCUSSIONS](./DISCUSSIONS.md) — via student chrome (**P1**)
- [RESOURCES](./RESOURCES.md) — via student chrome when they can see at least one item (**P1a**)
- [ACTIVITY](./ACTIVITY.md) — header bell (**P1**)
- [LESSON_PLAN](./LESSON_PLAN.md) — open a published lesson plan
- [CALENDAR](./CALENDAR.md) — month/week calendar in the sidebar
- [UNIT](./UNIT.md) — open a unit when linked from materials
- [COURSE](./COURSE.md) — open course context (read-focused)
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — account affordance
- [FEEDBACK](./FEEDBACK.md) — Send feedback (account menu)
- [ORG_PICKER](./ORG_PICKER.md) — switch org (when multi-org)
- [PRINT](./PRINT.md) — **Print this week** → `/my/<org-slug>/print-this-week`; per-material **Print** → material `…/print`

### Instructor / owner / admin

- [COURSE](./COURSE.md) — open a course (preview or this-week row)
- [CALENDAR](./CALENDAR.md) — month/week calendar
- [COURSE_ROSTER](./COURSE_ROSTER.md) — from “no enrollments” attention
- [COURSE_LIST](./COURSE_LIST.md) — view all / create course
- [ANNOUNCEMENTS](./ANNOUNCEMENTS.md) — via org chrome
- [DISCUSSIONS](./DISCUSSIONS.md) — via org chrome (**P1**)
- [RESOURCES](./RESOURCES.md) — via org chrome (**P1a**)
- [ACTIVITY](./ACTIVITY.md) — header bell (**P1**)
- [MATERIAL](./MATERIAL.md) — important-now item
- [ORG_ROSTER](./ORG_ROSTER.md) — people / students
- [ORG_SETTINGS](./ORG_SETTINGS.md) — via chrome / account menu
- [ORG_PICKER](./ORG_PICKER.md) — switch org
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — account
- [FEEDBACK](./FEEDBACK.md) — Send feedback (account menu)
- Search — staff chrome overlay (pages / courses / materials); dedicated route still TBD
- **P1:** [TEMPLATE_LIST](./TEMPLATE_LIST.md) — templates

## Notes

[FEATURES.md](../FEATURES.md) — Parent experience, units/dating, important now, **announcements**, **lesson plans**, calendar, print grain, RBAC, advanced search. **Discussions** are **P1** (sidebar, not This week cards). **Activity** is **P1** (header bell, not a sidebar tab). Parent summary layer is **P1**, not P0. Homework in P0 = dated materials on the week calendar (no separate assignment object). Staff home is an operational dashboard (attention + course previews + this week + people), not a nav tile grid.
