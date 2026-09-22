# COURSE_ROSTER

**URL:** `/my/<org-slug>/courses/<course_id>/roster`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors for this course; admins as needed.

## Purpose

Manage **who is enrolled** in this course instance (course has its own roster). Org-wide student directory remains [ORG_ROSTER](./ORG_ROSTER.md).


## Behavior

- List-first: enrolled students are the primary surface; add flows open on demand.
- **Enroll students** opens a panel with two paths:
  - **From roster** — multi-select eligible org students (filter, select all, clear). Optional **Class preset** checks that class’s members who aren’t already enrolled (one-shot; not a live link).
  - **New students** — batch create org profiles (multi-row or paste names) and enroll them in one confirm.
- Unenroll (withdrawn) from the row; parent **course** access requires enrollment in an active published course (membership is created on invite claim).
- **Invite parent** from an enrolled student — emails `/invite/<token>` for a parent email (copy-link remains). Multiple parents are managed on the student profile.
- Owners and admins **assign teachers** (course instructors). Instructors can see the list. Same assignment as [COURSE_SETTINGS](./COURSE_SETTINGS.md).
- Empty roster allowed — printing materials does not require students.

## Data shown

- Course context (title) for orientation
- **Teachers** assigned to the course
- Enrolled students: **name**, optional **grade**, parent / student email / invite status
- Batch picker of org students not already enrolled
- Optional class list for preset
- New-student draft rows: name (required), parent email, student email, grade (org scheme)

## Contents

- **Teachers** (add/remove for owners and admins)
- Enrolled list → [STUDENT_PROFILE](./STUDENT_PROFILE.md)
- **Enroll students** progressive panel (batch existing + batch new)
- Unenroll on each row
- Parent email / invite from course context — email + copy claim link
- Empty state: students optional — **create → print does not require a roster**

## Primary actions

- Assign / remove teachers (owners and admins)
- Enroll / unenroll (batch enroll preferred)
- Invite parent (email + copy the claim link)
- Open [STUDENT_PROFILE](./STUDENT_PROFILE.md)

## Links to

- [COURSE](./COURSE.md) — back to course
- [COURSE_SETTINGS](./COURSE_SETTINGS.md) — other course settings
- [USER_PROFILE](./USER_PROFILE.md) — teacher cards
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open student
- [INVITE_CLAIM](./INVITE_CLAIM.md) — copied parent invite link (recipient)
- [ORG_ROSTER](./ORG_ROSTER.md) — org-wide roster
- [CLASS](./CLASS.md) — class preset source (does not auto-enroll as a live link)
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Roster management, Classes enrollment decided (individuals + Class batch preset), parent invites, active course gating.
