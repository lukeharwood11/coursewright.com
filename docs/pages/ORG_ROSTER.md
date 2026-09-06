# ORG_ROSTER

**URL:** `/my/<org-slug>/roster`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Admins and instructors (per RBAC).

## Purpose

Org-level people directory for **student profiles** and **classes**. Course enrollments are managed on [COURSE_ROSTER](./COURSE_ROSTER.md). Staff invite/roles live under [ORG_SETTINGS](./ORG_SETTINGS.md).


## Behavior

- Org-level student directory for admins/instructors.
- Add a student (name required; optional parent email and grade per org scheme).
- Find students by name, grade, or parent email (list filter; P0 advanced search is a separate chrome job).
- Create a **class** (name only) and open it to manage members.
- Open student profile; navigate to families; course enrollments are edited on course roster.
- Staff invite/roles are **not** managed here ([ORG_SETTINGS](./ORG_SETTINGS.md)).
- Empty org is fine — create → print does not require a roster.

## Data shown

- Student list: **name**, optional **grade**, optional parent email
- Class list: class **name**
- Add-student fields: name, parent email, grade
- Empty state when no profiles yet

## Contents

- Add student form
- List student profiles in the org (search/filter)
- Create class; list classes → [CLASS](./CLASS.md)
- Optional grade level shown per org grade scheme
- Link to [FAMILIES](./FAMILIES.md) parent directory
- Open → [STUDENT_PROFILE](./STUDENT_PROFILE.md)
- Empty state: add a student here, or when first enrolled in a course or class

## Primary actions

- Add student
- Create class
- Open student
- Open class
- Navigate to families / a course roster

## Links to

- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open student
- [CLASS](./CLASS.md) — open class roster
- [FAMILIES](./FAMILIES.md) — family directory
- [COURSE_ROSTER](./COURSE_ROSTER.md) — enrollments live on courses
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md) (staff lives here), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Roster management, student profiles (no login P0/P1), classes, families. Parent invite *send* is still a separate flow.
