# STUDENT_PROFILE

**URL:** `/my/<org-slug>/roster/<student_id>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Admins and instructors.

## Purpose

View/edit one org-level **student profile** (not a user account in P0/P1).


## Behavior

- View/edit one `student_profile` (no student login in P0/P1).
- Edit name, optional parent email, optional grade (must match org grade scheme when set).
- Send/resend parent invite; show enrollments and family membership.
- Creating profiles often happens on first course enrollment; this page manages the canonical org record.

## Data shown

- **Name** (required, editable)
- **Parent email** (optional, editable)
- **Grade level** (optional, editable; scheme-constrained)
- Enrollments: course title + link/status
- Parent invite/claim status
- Family membership link when present

## Contents

### Fields (P0)

- **Name** — required
- **Parent email** — optional (invites / linkage)
- **Grade level** — optional; must match org grade scheme when set

### Related

- Enrollments in courses in this org → links to those [COURSE_ROSTER](./COURSE_ROSTER.md) contexts
- Parent invite / claim status
- Family membership → [FAMILY](./FAMILY.md) when grouped
- No student login controls (accounts = P2)

## Primary actions

- Edit profile fields
- Send / resend parent invite
- Open family / course enrollments

## Links to

- [ORG_ROSTER](./ORG_ROSTER.md) — back to roster
- [COURSE_ROSTER](./COURSE_ROSTER.md) — course enrollment contexts
- [FAMILY](./FAMILY.md) — household when grouped
- [FAMILIES](./FAMILIES.md) — directory
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Student profiles; parent access rules (active enrollment).
