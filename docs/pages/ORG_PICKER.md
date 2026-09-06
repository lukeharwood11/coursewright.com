# ORG_PICKER

**URL:** `/my`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Signed-in users (all roles). Multi-org users; first-time creators.

## Purpose

Choose an organization or create a new one. Cross-org entry before `<org-slug>` routes.


## Behavior

- Requires signed-in user.
- Lists orgs the user belongs to; selecting one navigates to that org’s home.
- Create organization: capture name, generate unique permalink slug, set creator as first **owner**, then open new org home.
- Empty state pushes “create your first org” (roster not required to get value later).

## Data shown

- For each membership: organization **name**, **slug** (and role badge TBD — owner / admin / instructor / parent)
- Create-org form fields: name (required); slug preview/generated (editable TBD on create)
- Link affordance to account settings
- Empty state copy when no memberships

## Contents

- List of orgs the user belongs to (admin, instructor, and/or parent memberships)
- Create organization — name + permalink slug generated on create; creator becomes **first owner**
- Collapsible **account sidebar**: Organizations (nested org names when present) and Account → [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)
- Empty state: one clear path to create the first org (create → print does not require a roster)

## Primary actions

- Open org → [ORG_HOME](./ORG_HOME.md) `/my/<org-slug>`
- Create organization
- Account settings

## Links to

- [ORG_HOME](./ORG_HOME.md) — open an organization
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — account settings

## Notes

[FEATURES.md](../FEATURES.md) — Org creation & admins; org permalink.
