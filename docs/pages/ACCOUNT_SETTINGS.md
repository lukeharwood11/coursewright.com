# ACCOUNT_SETTINGS

**URL:** `/my/settings`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Any signed-in user.

## Purpose

Cross-org account controls — not scoped to a single organization (contrast [ORG_SETTINGS](./ORG_SETTINGS.md)).


## Behavior

- Requires signed-in user; **not** scoped to an org slug.
- Load the signed-in user’s `profiles` row. Display name is editable; **Save** persists `profiles.name` (trimmed, required).
- **Email is read-only** in P0 — owned by Supabase Auth and synced onto `profiles.email`.
- **Save** is disabled when the name is unchanged. Sign out stays on this page (and in chrome) and returns the user to login.
- Does not edit org slug, grade scheme, or staff (those are [ORG_SETTINGS](./ORG_SETTINGS.md)).
- Avatar upload, Google connection actions, and other preferences are **TBD** — not on this screen in P0.

## Data shown

- **Name** — editable display name from `profiles.name`
- **Email** — read-only (`profiles.email`, falling back to the auth session email)
- Sign-out control

## Contents

- Profile form: name (edit) + email (read-only, with a short note that email follows sign-in)
- Save (disabled until the name changes)
- Sign out
- Same collapsible **account sidebar** as [ORG_PICKER](./ORG_PICKER.md): Organizations and Account
- Navigation back to `/my` or last org

## Primary actions

- Save display name
- Sign out
- Return to org picker

## Links to

- [ORG_PICKER](./ORG_PICKER.md) — back to org list
- [ORG_HOME](./ORG_HOME.md) — return to last org (when known)
- [LOGIN](./LOGIN.md) — after sign-out

## Notes

[FEATURES.md](../FEATURES.md) — Auth account only. Org staff, slug, and grade scheme live under **org** settings, not here. P0 fields are display name + read-only email + sign-out. Avatar, Google link management, and preference fields remain TBD.
