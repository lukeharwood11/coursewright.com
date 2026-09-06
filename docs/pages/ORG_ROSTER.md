# ORG_ROSTER

**URL:** `/my/<org-slug>/roster`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Admins and instructors (per RBAC).

## Purpose

Org-level people directory for **student profiles** (and related roster jobs). Course enrollments are managed on [COURSE_ROSTER](./COURSE_ROSTER.md). Staff invite/roles live under [ORG_SETTINGS](./ORG_SETTINGS.md).


## Behavior

- Org-level student directory for admins/instructors.
- Open student profile; navigate to families; course enrollments are edited on course roster.
- Staff invite/roles are **not** managed here ([ORG_SETTINGS](./ORG_SETTINGS.md)).
- Search/find students (ties to P0 advanced search).

## Data shown

- Student list: **name**, optional **grade**, parent email / invite status (TBD denseness)
- Counts or course enrollment summary TBD
- Empty state when no profiles yet

## Contents

- List student profiles in the org
- Search / find students (ties into P0 advanced search)
- Optional grade level shown per org grade scheme
- Parent linkage / invite status at a glance (TBD density)
- Link to [FAMILIES](./FAMILIES.md) parent directory
- Open → [STUDENT_PROFILE](./STUDENT_PROFILE.md)
- Empty state: students often appear when first enrolled in a course; admins/instructors can still manage profiles here

## Primary actions

- Open student
- Invite / link parent (as allowed)
- Navigate to families / a course roster

## Links to

- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open student
- [FAMILIES](./FAMILIES.md) — family directory
- [COURSE_ROSTER](./COURSE_ROSTER.md) — enrollments live on courses
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md) (staff lives here), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Roster management, student profiles (no login P0/P1), families.
