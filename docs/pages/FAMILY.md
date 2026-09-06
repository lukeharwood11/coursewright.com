# FAMILY

**URL:** `/my/<org-slug>/families/<family_id>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Admins and instructors (per directory visibility). Parents may later see their own family — TBD for P0.

## Purpose

One **family profile**: household of student profiles + parent users in this org.


## Behavior

- View one family profile; manage members when UX is locked (add/remove/merge/split TBD).
- Parents belonging via linked students are part of the family profile.
- Navigate to member student profiles and back to directory.

## Data shown

- Family identity — member **names** minimum; additional fields TBD; own display name TBD
- Student members: names → profiles
- Parent members: names/emails
- Related invite/linkage status TBD

## Contents

- Family identity — member **names** at minimum; additional profile fields **TBD**; whether family has its own display name **TBD**
- Student profiles in the household → [STUDENT_PROFILE](./STUDENT_PROFILE.md)
- Parent users linked to this family
- Actions: add/remove members, merge/split — **TBD** (FEATURES open)
- Back to [FAMILIES](./FAMILIES.md)

## Primary actions

- View members
- Manage membership (when UX locked)
- Open student / parent-related invite state

## Links to

- [FAMILIES](./FAMILIES.md) — back to directory
- [STUDENT_PROFILE](./STUDENT_PROFILE.md) — member students
- [ORG_ROSTER](./ORG_ROSTER.md) — roster
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Families & parent directory. Not the P2 cross-org parent family manager.
