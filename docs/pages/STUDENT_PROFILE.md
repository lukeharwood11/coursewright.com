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
- Show course enrollments, class membership, and family membership.
- Creating profiles often happens on first course or class add; this page manages the canonical org record.
- Send/resend parent invite is **not** on this page yet (email can be stored).

## Data shown

- **Name** (required, editable)
- **Parent email** (optional, editable)
- **Grade level** (optional, editable; scheme-constrained)
- Enrollments: course title + status + link to that course roster
- Class memberships: class name + link
- Family membership: household label + link (at most one family)
- Parent email (editable; invite send TBD)

## Contents

### Fields (P0)

- **Name** — required
- **Parent email** — optional (invites / linkage)
- **Grade level** — optional; must match org grade scheme when set

### Related

- Enrollments in courses in this org → links to those [COURSE_ROSTER](./COURSE_ROSTER.md) contexts
- Classes in this org → [CLASS](./CLASS.md)
- Family in this org → [FAMILY](./FAMILY.md)
- Parent email stored for later invite / linkage
- No student login controls (accounts = P2)

## Primary actions

- Edit profile fields
- Open class / course enrollments
- Open family when grouped

## Links to

- [ORG_ROSTER](./ORG_ROSTER.md) — back to roster
- [COURSE_ROSTER](./COURSE_ROSTER.md) — course enrollment contexts
- [CLASS](./CLASS.md) — class membership
- [FAMILY](./FAMILY.md) — household when grouped
- [FAMILIES](./FAMILIES.md) — directory
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Student profiles; parent access rules (active enrollment).
