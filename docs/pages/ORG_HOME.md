# ORG_HOME

**URL:** `/my/<org-slug>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

All org members. **Same URL**, different chrome/content by role (owner, admin, instructor, parent).

## Purpose

Organization home / dashboard. For parents this **is** the P0 parent dashboard (this week + important now). For instructors/owners/admins, an operational landing into courses, roster, settings.

## Behavior

Same URL for all roles; chrome and body switch by membership role.

### Parent

- Usability bar: understand child, course, and what’s needed immediately — no LMS jargon.
- Show **this calendar week** (Sunday–Saturday) and **Important now**.
- “This week” materials: effective date in range — material `scheduled_date` if set, else unit date range.
- **Print this week** and per-material **Print** are first-class (never overflow-only) — both land on [PRINT](./PRINT.md).
- Parent org access requires linked student enrolled in a course with `status = active` **and** `visibility = published` (dates informational only).
- Progress tab is P1 (dim/inactive until then). Parent summary layer (B) is **P1**, not P0.
- Empty: no dated work, or not yet on an active enrollment — plain-language next step.

### Instructor / owner / admin

- Operational landing: navigate to courses, roster, families, settings via a **collapsible org sidebar** (nested course/family names when they exist). (**P1:** templates.)
- **Advanced search** entry in product chrome when shipped (always-available, cross-facet — overlay vs route TBD).
- Optional widgets TBD (recent courses, needs attention).
- Switch org returns to org picker.
- Create → print does **not** require a roster (empty org/course still useful).

## Data shown

### Parent

- Org **name**
- Week range label (Sun–Sat dates)
- **Important now** items: material title, course/student context, link target
- Per **student profile**: name, grade badge TBD
- Per student → **courses** → this week’s **materials** (title, due/date in amber when dated)
- Print affordances (not data fields)

### Instructor / owner / admin

- Org **name**
- Nav destinations in the org sidebar (courses and families listed by name when present)
- TBD widget data: e.g. recent course titles/status, attention counts
- Search chrome (when shipped)

## Contents

### Parent view (usability anchor)

Tech-averse parents must understand what’s going on immediately — which child, what materials, what’s due.

- Top: org context + account affordance ([STYLE_GUIDE.md](../STYLE_GUIDE.md) parent pattern) → [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)
- Desktop: simpler collapsible sidebar (This week, their courses, Progress)
- Greeting + **current calendar week** (Sunday–Saturday) + **Print this week**
- **Important now** — instructor-flagged items (amber treatment)
- **This week** — dated materials whose effective date falls in the week (`scheduled_date` wins; else unit date range)
- Per student → course → materials; each material has **Print**
- Bottom tabs concept: This week | Progress (Progress **P1** — dim/inactive until then)
- Links into material / unit / course in the same URL tree (simpler chrome)

**Empty states**

- No dated work this week — plain language, no LMS jargon
- Not yet linked to an active enrollment — explain next step (invite / wait for roster)

### Instructor / owner / admin view

- Collapsible **org sidebar** for Home, Courses, Roster (nested class names when they exist), Families, Settings (course and family names nested when present)
- Org overview useful for running the co-op
- Obvious navigation: [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md) (**P1:** [TEMPLATE_LIST](./TEMPLATE_LIST.md))
- **Advanced search** in chrome (P0 — overlay vs `/search` route TBD)
- TBD widgets: recent courses, needs attention
- Switch org → [ORG_PICKER](./ORG_PICKER.md)
- Account menu (avatar) → User (Settings / Sign out) and Organization (Org settings / Switch → [ORG_PICKER](./ORG_PICKER.md)) — [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md), [ORG_SETTINGS](./ORG_SETTINGS.md)

## Primary actions

### Parent

- Print this week
- Open / print a material
- Open important-now items

### Instructor / owner / admin

- Open / create course
- Open roster / families / settings
- Search (when shipped)

## Links to

### Parent

- [MATERIAL](./MATERIAL.md) — open a this-week / important-now item
- [UNIT](./UNIT.md) — open a unit when linked from materials
- [COURSE](./COURSE.md) — open course context (read-focused)
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — account affordance
- [ORG_PICKER](./ORG_PICKER.md) — switch org (when multi-org)
- [PRINT](./PRINT.md) — **Print this week** → `/my/<org-slug>/print-this-week`; per-material **Print** → material `…/print`

### Instructor / owner / admin

- [COURSE_LIST](./COURSE_LIST.md) — courses
- [ORG_ROSTER](./ORG_ROSTER.md) — org roster (includes class list)
- [CLASS](./CLASS.md) — a class opened from roster
- [FAMILIES](./FAMILIES.md) — family directory
- [ORG_SETTINGS](./ORG_SETTINGS.md) — org settings
- [ORG_PICKER](./ORG_PICKER.md) — switch org
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — account
- Search — TBD overlay vs route
- **P1:** [TEMPLATE_LIST](./TEMPLATE_LIST.md) — templates

## Notes

[FEATURES.md](../FEATURES.md) — Parent experience, units/dating, important now, print grain, RBAC, advanced search. Parent summary layer is **P1**, not P0. Homework in P0 = dated materials on this week (no separate assignment object).
