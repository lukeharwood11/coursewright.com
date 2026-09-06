# CLASS

**URL:** `/my/<org-slug>/classes/<class_id>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Admins and instructors.

## Purpose

Manage one org-scoped **Class** — a named group of student profiles. A class is **not** a course and has no materials.


## Behavior

- Load one class in the org; staff can add and remove student profiles.
- Add an existing org student, or create a new student profile (name required; optional parent email and grade) and add them in one step.
- First-time add creates the org `student_profile` when they are new.
- Removing a student from the class does **not** unenroll them from courses (course enrollment stays student ↔ course until that workshop is locked).
- Empty class is allowed.

## Data shown

- Class **name** (title)
- Members: **name**, optional **grade**, optional parent email
- Add-student fields: name (required), parent email, grade (org scheme)
- Picker of org students not already in the class

## Contents

- Class name
- Member list → [STUDENT_PROFILE](./STUDENT_PROFILE.md)
- Add existing student / add new student
- Remove from class
- Empty state: add students when ready
- Back to [ORG_ROSTER](./ORG_ROSTER.md) (class list lives there)

## Primary actions

- Add / remove class members
- Open a student profile

## Links to

- [ORG_ROSTER](./ORG_ROSTER.md) — class list and org students
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open a member
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Classes (P0). Course ↔ Class enrollment is **workshop** — this page does not enroll a class into a course.
