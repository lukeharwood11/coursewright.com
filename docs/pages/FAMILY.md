# FAMILY

**URL:** `/my/<org-slug>/families/<family_id>`  
**URL map:** [URLS.md](../URLS.md)  
**SPA status:** Outline and feature remain; **not currently routed or linked** in the app.

## Audience

Admins and instructors (same staff visibility as Classes). Parents may later see their own family — TBD for P0.

## Purpose

One **family**: a named group of student profiles in this org. Parents appear only when they have `parent_student_links` to those students.


## Behavior

- View one family; staff add and remove **student** members (Class-mirror). Empty family is allowed.
- Add an existing org student who is not already in another family, or create a new student profile and add them.
- **Link a parent** by choosing an org account and/or email, and which student(s) in this family. That write **creates or reuses** `parent_student_links`. If the email has no Course Wright account in this org, save **one** pending `admin_invites` row with `role=parent` and attach the chosen students via `admin_invite_students` (send/claim still a separate flow). **Never write enrollments.** **Do not** write `family_members.parent_user_id` or `parent_invites`.
- Parents already linked to a student in this family show up automatically (including a parent who is also linked to a student in another family).
- Remove a student from the family. This does **not** delete parent–student links or course enrollments.
- A student profile belongs to at most one family.
- Navigate to member student profiles, the directory, and the org roster.

## Data shown

- Family identity — required display name; student names as fallback
- Student members: names, optional grade, optional parent email → profiles
- Parents (derived): names/emails and which students they are linked to
- Pending invites for students in this family (email + student), when present
- Pickers: org students not in another family; org accounts and/or email for linking

## Contents

- Family identity (name)
- Access copy: named student group, not a course; parents from student links
- Add existing student / add new student
- Link a parent (account or email; optional per-student vs all students)
- Student list → [STUDENT_PROFILE](./STUDENT_PROFILE.md) with remove
- Parent list (read-only) and pending invites
- Back to [FAMILIES](./FAMILIES.md) and [ORG_ROSTER](./ORG_ROSTER.md)

## Primary actions

- Add / remove student members
- Link a parent (create/reuse student links, or save a claim invite)
- Open a student profile

## Links to

- [FAMILIES](./FAMILIES.md) — back to directory
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — member students
- [ORG_ROSTER](./ORG_ROSTER.md) — roster
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Families & parent directory. Not the P2 cross-org parent family manager. Invite **send** and **claim** are still planned. Merge/split households is TBD. `family_members.parent_user_id` exists in schema but is unused for P0 app writes. Schema + `roster/databridge/families` remain; SPA page UI is currently removed.
