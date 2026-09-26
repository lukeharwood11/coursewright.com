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
- Other people in an organization see [USER_PROFILE](./USER_PROFILE.md) (`/my/<org-slug>/people/<org_profile_id>`), not this page. Owners and admins edit that person’s org name and contact email there.
- **Notifications** — this device. In a browser tab, a short note to install Course Wright on the home screen. In the installed app, **Turn on notifications** or **Turn off notifications**. If the device blocked permission, explain how to allow Course Wright in settings. The control stays hidden until push is set up on the server (**HN-018**), except that install note.
- Avatar upload, Google connection actions, and other preferences are **TBD** — not on this screen in P0.

## Data shown

- **Name** — editable display name from `profiles.name`
- **Email** — read-only (`profiles.email`, falling back to the auth session email)
- **Notifications** — install note, or on/off for this installed app
- Sign-out control

## Contents

- Profile form: name (edit) + email (read-only, with a short note that email follows sign-in)
- Notifications
- Save (disabled until the name changes)
- Sign out
- Same collapsible **account sidebar** as [ORG_PICKER](./ORG_PICKER.md): Organizations and Account
- Navigation back to `/my` or last org

## Primary actions

- Save display name
- Turn device notifications on or off (installed app)
- Sign out
- Return to org picker

## Links to

- [USER_PROFILE](./USER_PROFILE.md) — how others in an org see you; org name is edited there
- [ORG_PICKER](./ORG_PICKER.md) — back to org list
- [ORG_HOME](./ORG_HOME.md) — return to last org (when known)
- [FEEDBACK](./FEEDBACK.md) — Send feedback (account menu)
- [LOGIN](./LOGIN.md) — after sign-out

## Notes

[FEATURES.md](../FEATURES.md) — Auth account only. Org staff, slug, and grade scheme live under **org** settings, not here. P0 fields are display name + read-only email + sign-out. Org name and contact email live on [USER_PROFILE](./USER_PROFILE.md). Installed-app Activity notifications are on this page. Avatar, Google link management, and other preference fields remain TBD.
