# FAMILIES

**URL:** `/my/<org-slug>/families`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Admins and instructors (same staff visibility as Classes). Parents do not use this directory in P0.

## Purpose

Org-scoped **parent / family directory** — find households without hunting course rosters.


## Behavior

- Browse org-scoped family directory (owners, admins, and instructors).
- Create a family with an optional display name; open it to add students and link parents.
- Empty state explains grouping a household and that family membership does not grant course access.
- Org-scoped only (cross-org family management is P2).

## Data shown

- Family list: display name when set, otherwise names derived from members; member summary (student and parent counts)
- Empty state explaining linking households
- Create field: optional family name

## Contents

- Create family (optional name)
- List families (households) in the org
- Open → [FAMILY](./FAMILY.md)
- Empty state: create a household, add students, link a parent
- Jump to related [ORG_ROSTER](./ORG_ROSTER.md) students
- Cross-org family management is **P2** — this page is org-scoped only

## Primary actions

- Create family
- Open family
- Jump to related [ORG_ROSTER](./ORG_ROSTER.md) students

## Links to

- [FAMILY](./FAMILY.md) — open family
- [ORG_ROSTER](./ORG_ROSTER.md) — related students
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Families & parent directory (P0). **Access lock:** family is directory convenience only; materials / this-week / print stay enrollment + `parent_student_links`. Extra profile fields beyond names, merge/split, and a parent-facing family profile remain TBD.
