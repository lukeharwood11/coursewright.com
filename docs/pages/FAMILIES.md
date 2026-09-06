# FAMILIES

**URL:** `/my/<org-slug>/families`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Admins and instructors (exact visibility TBD — FEATURES leaves admin-only vs instructor-visible open).

## Purpose

Org-scoped **parent / family directory** — find households without hunting course rosters.


## Behavior

- Browse org-scoped family directory (admin and/or instructor — exact visibility TBD).
- Open a family; create/group households from roster associations (UX TBD).
- Org-scoped only (cross-org family management is P2).

## Data shown

- Family list: household label/names (display name TBD), member summary (students/parents counts or names)
- Empty state explaining linking households

## Contents

- List families (households) in the org
- Built from roster + parent links; group siblings into one family
- Open → [FAMILY](./FAMILY.md)
- Empty state: explain linking parents/students into a household
- Cross-org family management is **P2** — this page is org-scoped only

## Primary actions

- Open family
- Create / group family (TBD UX)
- Jump to related [ORG_ROSTER](./ORG_ROSTER.md) students

## Links to

- [FAMILY](./FAMILY.md) — open family
- [ORG_ROSTER](./ORG_ROSTER.md) — related students
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Families & parent directory (P0). Profile fields beyond names still open.
