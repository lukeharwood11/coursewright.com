# ORG_ROSTER

**URL:** `/my/<org-slug>/roster`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Admins and instructors (per RBAC).

## Purpose

Org-level people directory for **student profiles** and **classes**. Course enrollments are managed on [COURSE_ROSTER](./COURSE_ROSTER.md). Staff invite/roles live under [ORG_SETTINGS](./ORG_SETTINGS.md).


## Behavior

- Directory-first: searchable student list is the primary surface.
- **Select students** on the list (checkboxes, select all matching) → **Add to class** or **Enroll in course** (pick destination; batch write).
- **Add students** opens a batch create panel (multi-row and/or paste names one-per-line; name required; optional parent email, student email, and grade per org scheme).
- Find students by name, grade, parent email, or student email (list filter; P0 advanced search is a separate chrome job).
- **Classes** listed below; **Create class** is compact (name only) — open the class to manage members, or assign from the student selection bar.
- Open student profile; course enrollments can also be edited on course roster.
- Staff invite/roles are **not** managed here ([ORG_SETTINGS](./ORG_SETTINGS.md)).
- Empty org is fine — create → print does not require a roster.

## Data shown

- Student list: **name**, optional **grade**, optional parent / student email
- Class list: class **name**
- Batch add fields: name rows, optional parent email / student email / grade, paste names
- Empty state when no profiles yet

## Contents

- Students list + find filter + **Add students**
- Classes list + create class → [CLASS](./CLASS.md)
- Open → [STUDENT_PROFILE](./STUDENT_PROFILE.md)
- Empty state: add students here, or when first enrolled in a course or class

## Primary actions

- Select students → add to class / enroll in course
- Add students (batch create)
- Create class
- Open student
- Open class
- Navigate to a course roster

## Links to

- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open student
- [CLASS](./CLASS.md) — open class roster
- [COURSE_ROSTER](./COURSE_ROSTER.md) — enrollments live on courses
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md) (staff lives here), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Roster management, student profiles (no login P0/P1), classes, families. Parent invite *send* is still a separate flow. Families directory UI is not currently exposed in the SPA.
