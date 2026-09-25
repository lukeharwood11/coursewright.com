# STUDENT_PROFILE

**URL:** `/my/<org-slug>/students/<student_id>`  
**Redirect:** `/my/<org-slug>/roster/<student_id>` → this page  
**URL map:** [URLS.md](../URLS.md)

## Audience

Teachers, parents (linked students), admins, and owners. Learners are sent to [PROGRESS](./PROGRESS.md).

## Purpose

View/edit one org-level **student profile**, including an optional student account invite.


## Behavior

- View/edit one `student_profile`.
- Edit name, optional student email, optional grade (must match org grade scheme when set).
- **Parents:** add **one or more** parent emails. If the address already belongs to someone in the organization, link them as a parent (no invite). Otherwise email an `/invite/<token>` (copy-link remains). Linked parents and pending invites are listed.
- **Student account:** optional student email. Invite uses `admin_invites.role = student` (not a parent invite). Claim sets `user_id` so that person sees this one student’s work.
- **Save** / **Cancel** in the page header; Save disabled when nothing changed; Cancel goes back (confirms if dirty).
- **Remove** (confirm) deletes the profile. They leave classes and courses. A student-account membership ends; a staff role is kept.
- Show course enrollments and class membership. A class link opens the same [CLASS](./CLASS.md) page as the Students **Classes** tab.
- **Grades** lists each active course the viewer may read (teachers: courses they teach; owners/admins: all; parents: linked published courses). The label is derived from the org scale. A final override shows that label and the stamp.
- Staff who can act see **Gradebook** and **Report card** on each course row they can manage (Pattern A). **Report card** drafts one enrollment at a time and opens the draft. **Draft** appears when a draft already exists for that course.
- Parents do not edit the profile, remove the student, or generate cards. They see classes and grades.
- Activity for a saved quiz grade or a final override opens this page for a linked parent. A device notification uses `?activity=` and marks that row read.
- **Announce** (staff) → [ANNOUNCEMENT](./ANNOUNCEMENT.md) new with audience prefilled.
- Owners and admins who can edit see **Grading settings** on the grades section.
- Creating profiles often happens on first course or class add; this page manages the canonical org record.

## Data shown

- **Name** (required, editable)
- **Student email** (optional, editable)
- **Grade level** (optional, editable; scheme-constrained)
- Parents: linked accounts, pending invites; **Add a parent** when none yet, **Add another parent** after the first
- Enrollments: course title + status. Staff link to that course roster; parents link to the course
- Class memberships: class name + link to the canonical class page
- Grades: course title, derived percent/label or override, stamp when overridden
- Report cards (staff): course, status (`draft` / `submitted` / `sent`)
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
- Student account: linked user when `user_id` is set, or a pending student invite
- No family-directory controls while the families directory is unrouted

## Primary actions

- Edit profile fields
- Remove from the roster
- Create Announcement
- Create parent (or student-email) invite (email + copy the claim link); **Resend email** or cancel a pending invite; add a parent (then another)
- Open class / course enrollments
- Staff: open gradebook, generate a report card, open a card
- Owners/admins: open grading settings

## Links to

- [ORG_ROSTER](./ORG_ROSTER.md) — back to students
- [PROGRESS](./PROGRESS.md) — learner redirect
- [COURSE_GRADEBOOK](./COURSE_GRADEBOOK.md) — staff gradebook for a course
- [REPORT_CARD](./REPORT_CARD.md) — generate / open a card
- [ORG_SETTINGS](./ORG_SETTINGS.md) — grading settings (owners/admins)
- [ANNOUNCEMENT](./ANNOUNCEMENT.md) — Create Announcement for this student
- [INVITE_CLAIM](./INVITE_CLAIM.md) — copied parent invite link (recipient)
- [COURSE_ROSTER](./COURSE_ROSTER.md) — course enrollment contexts
- [CLASS](./CLASS.md) — class membership
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Student profiles; parent access rules (active enrollment). Family membership UI is not currently shown on this page (families directory not routed).
