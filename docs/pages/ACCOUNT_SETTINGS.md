# ACCOUNT_SETTINGS

**URL:** `/my/settings`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Any signed-in user.

## Purpose

Cross-org account controls — not scoped to a single organization (contrast [ORG_SETTINGS](./ORG_SETTINGS.md)).


## Behavior

- Requires signed-in user; **not** scoped to an org slug.
- View/update account-level profile and auth-related settings.
- Sign out returns user to login (account menu in chrome and this page).
- Does not edit org slug, grade scheme, or staff (those are [ORG_SETTINGS](./ORG_SETTINGS.md)).

## Data shown

- Profile: display name / avatar (TBD exact fields) — editable
- Auth: email; Google connection status (TBD exact actions)
- Preferences (TBD)
- Read-only account identifiers as needed (user id not shown unless useful)

## Contents

- Profile display (name / avatar — TBD exact fields)
- Auth account info (email; Google connection — TBD exact actions)
- Preferences (TBD)
- Sign out (if not only in chrome)
- Same collapsible **account sidebar** as [ORG_PICKER](./ORG_PICKER.md): Organizations and Account
- Navigation back to `/my` or last org

## Primary actions

- Update profile / preferences
- Manage auth linkage (TBD)
- Return to org picker

## Links to

- [ORG_PICKER](./ORG_PICKER.md) — back to org list
- [ORG_HOME](./ORG_HOME.md) — return to last org (when known)

## Notes

[FEATURES.md](../FEATURES.md) — Auth account only. Org staff, slug, and grade scheme live under **org** settings, not here. Keep P0 fields minimal — FEATURES does not specify account preference fields beyond auth identity.
