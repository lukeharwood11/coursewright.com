# TEMPLATE_SETTINGS

**URL:** `/my/<org-slug>/templates/<template_id>/settings`  
**URL map:** [URLS.md](../URLS.md)  
**Phase:** **P1** — not in P0 product UI

## Audience

Template **owner**; org admins. Edit/view users may be read-only or blocked — TBD.

## Purpose

Template metadata and **access control** (owner / edit / view).


## Behavior

- Owners (and org admins) manage metadata and ACL.
- Grant/change/revoke **owner / edit / view**; creator defaults to owner.
- Instructors with **view** can create courses from the template (enforced in create flow).
- Soft-delete/archive template TBD.

## Data shown

- Template **name**, **grade metadata**
- ACL table: user (name/email), permission (**owner** | **edit** | **view**)
- Pending access invites TBD

## Contents

- Template name
- Grade-level metadata (same model as courses; org grade scheme)
- **ACL**
  - **Owner** — full control; default = creator
  - **Edit** — modify content/structure
  - **View** — see template; instructors with view can create a course from it
- Soft-delete / archive template — TBD UX
- Org admins can see/manage every template in the org

## Primary actions

- Save metadata
- Grant / change / revoke access
- Dangerous delete with soft-delete + versioning awareness

## Links to

- [TEMPLATE](./TEMPLATE.md) — back to template builder
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [FAMILIES](./FAMILIES.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Template access controls.
