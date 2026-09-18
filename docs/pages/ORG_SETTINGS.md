# ORG_SETTINGS

**URL:** `/my/<org-slug>/settings`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Org **owners** and **admins** (can edit). Instructors may view read-only. Parents cannot change settings. Billing is **owner-only**.

## Purpose

Configure the organization: identity, permalink, type, grade scheme, and **staff** (section on this page — not a separate top-level route).


## Behavior

- Requires org **owner or admin** to save identity / grade scheme / type.
- Instructors see the same fields, disabled.
- Parents are told they cannot change settings.
- Save org name/metadata; changing **permalink slug** shows a warning that existing links break (no auto-redirect in P0) and requires an explicit confirmation.
- **Save** and **Cancel** stay in the page header (upper right). Save is disabled when nothing changed; Cancel goes back (confirms first if there are unsaved changes).
- Set org **type** (co-op / micro-school) and **grade scheme** (K–12 / custom labels).
- Staff section on this page: invite by email, change roles, remove staff — UI TBD; block remove/demote of last owner or admin.
- Billing section is P1 placeholder, **shown only to owners**.

## Data shown

- Organization **name**, **slug**, **org type**
- Current **grade scheme** and labels (K–12 preset or custom)
- Staff list: person name/email, role (owner | admin | instructor), invite/claim status — TBD
- Pending admin/instructor invites (email, status) — TBD
- Billing status — P1, owner only

## Contents

### Organization

- Organization name
- **Permalink slug** — editable; UI **must warn** that changing it breaks existing links (no auto-redirect in P0)
- Organization type: co-op or micro-school

### Grade scheme

- Org chooses how student grade levels work: exact grade, grade range, or custom
- Shipped presets: **K–12** and **Custom**
- Affects student profile grade fields and course grade metadata (**P1:** templates too)

### Staff / roles (section)

- List owners, admins, and instructors
- Invite admins / instructors by email (claimable)
- Change **admin ↔ instructor** for existing staff
- Remove admins/instructors
- Guard: cannot remove or demote the **last remaining owner or admin**

### Billing (P1)

- Placeholder — Course Wright bills the org (Stripe hypothesis)
- **Owners only.** Admins can run the org; they cannot manage payment.

## Primary actions

- Save org settings / slug (with warning) — header Save disabled when unchanged; Cancel leaves (confirm if dirty)
- Cancel — discard unsaved changes
- Set grade scheme
- Invite / change role / remove staff (TBD)

## Links to

- [ORG_HOME](./ORG_HOME.md) — back to the organization
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — cross-org account settings (distinct from this page)
- [LOGIN](./LOGIN.md) — after sign-out (if sign-out lives in chrome)
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Org creation & owners/admins, grade scheme, RBAC, admin account management. Account-level prefs → [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md).
