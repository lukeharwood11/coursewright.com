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
- **Save** / **Cancel** in the page header; Save disabled when nothing changed; Cancel goes back (confirms if dirty).
- Show course enrollments and class membership.
- Creating profiles often happens on first course or class add; this page manages the canonical org record.
- **Invite parent:** if a parent email is saved, create a parent invite and **copy `/invite/<token>`** (v0 does not send email). Same claim path as staff.

## Data shown

- **Name** (required, editable)
- **Parent email** (optional, editable)
- **Grade level** (optional, editable; scheme-constrained)
- Enrollments: course title + status + link to that course roster
- Class memberships: class name + link
- Parent invite / claim status (pending link, copyable claim URL, or accepted)

## Contents

### Fields (P0)

- **Name** — required
- **Parent email** — optional (invites / linkage)
- **Grade level** — optional; must match org grade scheme when set

### Related

- Enrollments in courses in this org → links to those [COURSE_ROSTER](./COURSE_ROSTER.md) contexts
- Classes in this org → [CLASS](./CLASS.md)
- Parent invite / claim status on this page; copy `/invite/<token>` (no email send)
- Family membership is not shown here while the families directory is unrouted
- No student login controls (accounts = P2)

## Primary actions

- Edit profile fields
- Create parent invite and copy the claim link; cancel a pending invite
- Open class / course enrollments

## Links to

- [ORG_ROSTER](./ORG_ROSTER.md) — back to roster
- [INVITE_CLAIM](./INVITE_CLAIM.md) — copied parent invite link (recipient)
- [COURSE_ROSTER](./COURSE_ROSTER.md) — course enrollment contexts
- [CLASS](./CLASS.md) — class membership
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Student profiles; parent access rules (active enrollment). Family membership UI is not currently shown on this page (families directory not routed).
