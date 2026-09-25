# ORG_PROFILE

**URL:** `/my/<org-slug>/profile`  
**URL map:** [URLS.md](../URLS.md)

## Audience

All org members (owner, admin, instructor, parent, student).

## Purpose

Read-only view of the organization’s identity and public contact details. Replaces the former **About this organization** block on [ORG_HOME](./ORG_HOME.md).

## Behavior

- Loads org data from the org shell (same summary as home chrome).
- **Edit organization** appears only for **owners** and links to [ORG_SETTINGS](./ORG_SETTINGS.md).
- Admins and other roles see the same fields read-only; they still manage org settings via chrome when staff.

## Data shown

- Name, icon (when set), permalink (`/my/<org-slug>`)
- Organization type
- School days
- Optional: about, location, website, contact email, phone (omitted when unset)

## Contents

- Header with icon + name + permalink
- Owner-only **Edit organization** button
- Field list for type, school days, and optional profile fields

## Primary actions

- Open org settings (owners only)
- Return via browser back or org chrome

## Links to

- [ORG_SETTINGS](./ORG_SETTINGS.md) — owners edit
- [ORG_HOME](./ORG_HOME.md) — via org chrome
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — account menu
- [ORG_PICKER](./ORG_PICKER.md) — switch org (account menu)

## Notes

[FEATURES.md](../FEATURES.md) — Org profile. Not a public marketing page.
