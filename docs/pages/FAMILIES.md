# FAMILIES

**URL:** `/my/<org-slug>/families`  
**URL map:** [URLS.md](../URLS.md)  
**SPA status:** Outline and feature remain; **not currently routed or linked** in the app.

## Audience

Admins and instructors (same staff visibility as Classes). Parents do not use this directory in P0.

## Purpose

Org-scoped **parent / family directory** — find named student groups (households) without hunting course rosters.


## Behavior

- Browse org-scoped family directory (owners, admins, and instructors).
- Create a **named** family (required name, like a class). Empty family is allowed; add students on the family page.
- Empty state explains grouping students and that parents appear from parent–student links, not family membership.
- Org-scoped only (cross-org family management is P2). Sidebar lists families by name when this screen is restored.

## Data shown

- Family list: required display name (fallback to student names if missing); member summary (student count and parent count derived from links)
- Empty state explaining linking households
- Create field: family name (required)

## Contents

- Create family (name required)
- List families in the org
- Open → [FAMILY](./FAMILY.md)
- Empty state: create a named group, add students, link a parent to those students
- Jump to related [ORG_ROSTER](./ORG_ROSTER.md) students
- Cross-org family management is **P2** — this page is org-scoped only

## Primary actions

- Create family
- Open family
- Jump to related [ORG_ROSTER](./ORG_ROSTER.md) students

## Links to

- [FAMILY](./FAMILY.md) — open family
- [ORG_ROSTER](./ORG_ROSTER.md) — related students
- Via org chrome (when restored): [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Families & parent directory (P0). **Access lock:** family is a named group of students (Class-mirror). Parents are derived from `parent_student_links`. Materials / this-week / print stay enrollment + that student link. Extra profile fields, merge/split, parent-facing profile, and invite send/claim remain TBD. Schema + `roster/databridge/families` remain; SPA page UI is currently removed.
