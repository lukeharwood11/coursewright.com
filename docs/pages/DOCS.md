# DOCS

**URL:** `/docs` (Getting started); nested topics `/docs/<slug>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Prospective and current users who need a short product how-to — admins, owners, instructors, and parents.

## Purpose

Public help documentation: getting started, organization basics, courses, roster, staff roles, and a parent-facing overview.

## Behavior

- Public static pages — no account required; no org/course data fetch.
- Shared marketing header/footer; docs shell adds a **left topic nav** (collapsible on small screens).
- `/docs` is Getting started. Other topics use locked slugs under `/docs/<slug>`.
- Unknown slugs redirect to `/docs`.
- Adjacent topic pager at the bottom of each article.
- Header and footer label this area **Help** → `/docs`.

## Data shown

- Topic title, short description, and static instructional copy from `helpDocs.ts`
- Sidebar of help topics (grouped)
- Previous / next topic links

## Contents

| Topic | URL |
|-------|-----|
| Getting started | `/docs` |
| Your organization | `/docs/organization` |
| Courses & materials | `/docs/courses` |
| Roster | `/docs/roster` |
| Staff & roles | `/docs/staff-roles` |
| Student experience | `/docs/parents` |

Roster covers students, classes, enrollments, and parent invites. Staff & roles covers inviting owners/admins/instructors and permission differences (aligned with FEATURES RBAC).

## Primary actions

- Browse topics via left nav
- Follow previous / next
- Via marketing chrome: Sign up, Sign in, other marketing pages

## Links to

- [HOME](./HOME.md), [ABOUT](./ABOUT.md), [PRICING](./PRICING.md), [SIGNUP](./SIGNUP.md), [LOGIN](./LOGIN.md) — marketing chrome
- via marketing footer: [HOME](./HOME.md), [ABOUT](./ABOUT.md), [PRICING](./PRICING.md), [DOCS](./DOCS.md), [LOGIN](./LOGIN.md), [SIGNUP](./SIGNUP.md), [CONTACT](./CONTACT.md), [PRIVACY](./PRIVACY.md), [TERMS](./TERMS.md), [COOKIES](./COOKIES.md)
- Product destinations named in copy (not navigated as in-app deep links from help): [ORG_PICKER](./ORG_PICKER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_ROSTER](./ORG_ROSTER.md), [COURSE_LIST](./COURSE_LIST.md), [INVITE_CLAIM](./INVITE_CLAIM.md)

## Notes

[FEATURES.md](../FEATURES.md) — Marketing site, Organizations, Roster, RBAC, Admin invites. Keep help copy in sync when roles or invite flows change. Start small; expand topics without inventing P1/P2 behavior.
