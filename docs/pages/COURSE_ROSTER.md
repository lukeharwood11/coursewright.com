# COURSE_ROSTER

**URL:** `/my/<org-slug>/courses/<course_id>/roster`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors for this course; admins as needed.

## Purpose

Manage **enrollments** for this course instance (course has its own roster). Org-wide student directory remains [ORG_ROSTER](./ORG_ROSTER.md).


## Behavior

- Manage enrollments for this course only.
- Add student: if new to org, create `student_profile` (name required; optional parent email, grade).
- Unenroll / adjust enrollment; parent org access requires enrollment in a course with `status = active`.
- Parent invite by email from course context.
- Empty roster allowed — printing materials does not require students.

## Data shown

- Course context (title) for orientation
- Enrolled students: **name**, optional **grade**, parent email / invite status, enrollment status
- Add-student form fields: name (required), parent email, grade (org scheme)
- Instructors list or link to settings (TBD split)

## Contents

- List enrolled student profiles
- Add student — if new to the org, creates `student_profile` (name required; optional parent email, grade)
- Unenroll / manage enrollment (active status matters for parent org access rules)
- Parent email / invite from course context
- Co-teachers may be shown or linked from [COURSE_SETTINGS](./COURSE_SETTINGS.md) — TBD split
- Empty state: add students optional — **create → print does not require a roster**

## Primary actions

- Add / remove enrollment
- Invite parent by email
- Open [STUDENT_PROFILE](./STUDENT_PROFILE.md)

## Links to

- [COURSE](./COURSE.md) — back to course
- [COURSE_SETTINGS](./COURSE_SETTINGS.md) — instructors / related settings (TBD split)
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open student
- [ORG_ROSTER](./ORG_ROSTER.md) — org-wide roster
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Roster management, student profiles, parent invites, active course gating.
