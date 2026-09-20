# CLASS

**URL:** `/my/<org-slug>/classes/<class_id>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Admins and instructors.

## Purpose

Manage one org-scoped **Class** — a named group of student profiles. A class is **not** a course and has no materials.


## Behavior

- List-first member list; **Add students** opens a progressive panel.
- **From roster** — multi-select eligible org students (filter, select all, clear).
- **New students** — batch create org profiles and add them to this class in one confirm.
- First-time add creates the org `student_profile` when they are new.
- Removing a student from the class does **not** unenroll them from courses.
- Empty class is allowed.
- **Announce** to this class → [ANNOUNCEMENT](./ANNOUNCEMENT.md) new with audience prefilled.
- Disclaimer: membership here does not enroll in a course — use [COURSE_ROSTER](./COURSE_ROSTER.md) (Class may be a batch preset there).

## Data shown

- Class **name** (title)
- Members: **name**, optional **grade**, optional parent / student email
- Batch picker of org students not already in the class
- New-student draft rows: name (required), parent email, student email, grade (org scheme)

## Contents

- Member list → [STUDENT_PROFILE](./STUDENT_PROFILE.md)
- **Add students** panel (batch existing + batch new)
- Remove from class on each row
- Empty state: add students when ready
- Back to [ORG_ROSTER](./ORG_ROSTER.md) (class list lives there)

## Primary actions

- Add / remove class members (batch add preferred)
- Open a student profile
- Create Announcement

## Links to

- [ORG_ROSTER](./ORG_ROSTER.md) — class list and org students
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open a member
- [ANNOUNCEMENT](./ANNOUNCEMENT.md) — Create Announcement for this class
- [COURSE_ROSTER](./COURSE_ROSTER.md) — enroll in a course (Class as preset)
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Classes (P0). Course enrolls individuals; Class is a batch preset into enroll, not a live link.
