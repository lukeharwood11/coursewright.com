# STUDENT_PROFILE

**URL:** `/my/<org-slug>/roster/<student_id>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Admins and instructors.

## Purpose

View/edit one org-level **student profile** (not a dedicated student account in P0/P1).


## Behavior

- View/edit one `student_profile` (no dedicated student role in P0/P1).
- Edit name, optional student email, optional grade (must match org grade scheme when set).
- **Parents:** add **one or more** parent emails; each is emailed an `/invite/<token>` (copy-link remains). Linked parents and pending invites are listed.
- **Student email:** optional. Invite uses the same claim path so that email can sign in and see this student's work.
- **Save** / **Cancel** in the page header; Save disabled when nothing changed; Cancel goes back (confirms if dirty).
- Show course enrollments and class membership.
- Creating profiles often happens on first course or class add; this page manages the canonical org record.

## Data shown

- **Name** (required, editable)
- **Student email** (optional, editable)
- **Grade level** (optional, editable; scheme-constrained)
- Parents: linked accounts, pending invites, add another parent email
- Enrollments: course title + status + link to that course roster
- Class memberships: class name + link
- Parent invite / claim status (pending link, copyable claim URL, or accepted)

## Contents

### Fields (P0)

- **Name** — required
- **Student email** — optional (invite to view this student’s work)
- **Grade level** — optional; must match org grade scheme when set
- **Parents** — one or more emails; invite / copy / cancel per email

### Related

- Enrollments in courses in this org → links to those [COURSE_ROSTER](./COURSE_ROSTER.md) contexts
- Classes in this org → [CLASS](./CLASS.md)
- Parent invite / claim status on this page; email + copy `/invite/<token>`
- Family membership is not shown here while the families directory is unrouted
- No dedicated student-role controls (accounts = P2; student email uses parent claim path)

## Primary actions

- Edit profile fields
- Create parent (or student-email) invite (email + copy the claim link); cancel a pending invite; add another parent
- Open class / course enrollments

## Links to

- [ORG_ROSTER](./ORG_ROSTER.md) — back to roster
- [INVITE_CLAIM](./INVITE_CLAIM.md) — copied parent invite link (recipient)
- [COURSE_ROSTER](./COURSE_ROSTER.md) — course enrollment contexts
- [CLASS](./CLASS.md) — class membership
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Student profiles; parent access rules (active enrollment). Family membership UI is not currently shown on this page (families directory not routed).
