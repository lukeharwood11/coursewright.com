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
- Owners and admins **assign teachers** (class leads — zero or more owners, admins, or instructors). Instructors can see the list. Leads are notified in [ACTIVITY](./ACTIVITY.md) when someone posts in a discussion for this class.
- **Announce** to this class → [ANNOUNCEMENT](./ANNOUNCEMENT.md) new with audience prefilled.
- **Start a discussion** (**P1**) → [DISCUSSION](./DISCUSSION.md) new with this class prefilled.
- Disclaimer: membership here does not enroll in a course — use [COURSE_ROSTER](./COURSE_ROSTER.md) (Class may be a batch preset there).

## Data shown

- Class **name** (title)
- Optional **teachers / leads** (owners, admins, or instructors assigned to this class)
- Members: **name**, optional **grade**, optional parent / student email
- Batch picker of org students not already in the class
- New-student draft rows: name (required), parent email, student email, grade (org scheme)

## Contents

- Member list → [STUDENT_PROFILE](./STUDENT_PROFILE.md)
- **Teachers** (add/remove for owners and admins). An info icon next to the heading explains that they are optional class leads and are notified in Activity when someone posts in a discussion for this class.
- **Add students** panel (batch existing + batch new)
- Remove from class on each row
- Empty state: add students when ready
- Back to [ORG_ROSTER](./ORG_ROSTER.md) (class list lives there)

## Primary actions

- Add / remove class members (batch add preferred)
- Assign / remove teachers (owners and admins)
- Open a student profile
- Create Announcement
- Start a discussion (**P1**)

## Links to

- [ORG_ROSTER](./ORG_ROSTER.md) — class list and org students
- [USER_PROFILE](./USER_PROFILE.md) — teacher cards
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — open a member
- [ANNOUNCEMENT](./ANNOUNCEMENT.md) — Create Announcement for this class
- [DISCUSSION](./DISCUSSION.md) — Start a discussion for this class (**P1**)
- [ACTIVITY](./ACTIVITY.md) — leads are notified here when someone posts
- [COURSE_ROSTER](./COURSE_ROSTER.md) — enroll in a course (Class as preset)
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Classes (P0). Course enrolls individuals; Class is a batch preset into enroll, not a live link. Class leads optional.
