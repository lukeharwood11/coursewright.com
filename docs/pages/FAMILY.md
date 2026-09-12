# FAMILY

**URL:** `/my/<org-slug>/families/<family_id>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Admins and instructors (same staff visibility as Classes). Parents may later see their own family — TBD for P0.

## Purpose

One **family profile**: household of student profiles + parent users in this org.


## Behavior

- View one family profile; staff add and remove members.
- Add an existing org student who is not already in another family, or create a new student profile and add them.
- Link a parent who already has a Course Wright account in this organization. That write **creates or reuses** `parent_student_links` for students currently in the household (and when a student is added later, for parents already on the family). Family membership is not an access gate.
- Remove a member from the family. This does **not** delete parent–student links or course enrollments (same convenience rule as Classes).
- A student profile belongs to at most one family.
- Empty family is allowed.
- Navigate to member student profiles, the directory, and the org roster.

## Data shown

- Family identity — optional display name; otherwise member names
- Student members: names, optional grade, optional parent email → profiles
- Parent members: names and emails
- Pickers: org students not in another family; org accounts not already linked to this family

## Contents

- Family identity (display name or derived member names)
- Access copy: household directory, not a course
- Add existing student / add new student
- Link a parent account
- Student list → [STUDENT_PROFILE](./STUDENT_PROFILE.md) with remove
- Parent list with remove
- Back to [FAMILIES](./FAMILIES.md) and [ORG_ROSTER](./ORG_ROSTER.md)

## Primary actions

- Add / remove student members
- Link / remove parent members (link also ensures student links)
- Open a student profile

## Links to

- [FAMILIES](./FAMILIES.md) — back to directory
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — member students
- [ORG_ROSTER](./ORG_ROSTER.md) — roster
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Families & parent directory. Not the P2 cross-org parent family manager. Sending parent invites is still a separate planned flow. Merge/split households is TBD.
