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
- Parents (and staff **Parent view**) are sent back to [ORG_HOME](./ORG_HOME.md).
- Save org name/metadata; changing **permalink slug** shows a warning that existing links break (no auto-redirect in P0) and requires an explicit confirmation.
- **Save** and **Cancel** stay in the page header (upper right). Save is disabled when nothing changed; Cancel goes back (confirms first if there are unsaved changes).
- Set org **type** (co-op / micro-school) and **grade scheme** (K–12 / custom labels).
- Staff section on this page: invite owner / admin / instructor by email (Resend `organization-invite`) and **copy a claim link**, list pending invites. Parent invites use the same `/invite/<token>` path from [STUDENT_PROFILE](./STUDENT_PROFILE.md) / [COURSE_ROSTER](./COURSE_ROSTER.md). Owners and admins **change admin ↔ instructor** and **remove** admins/instructors; the last remaining owner or admin cannot be removed or demoted. Those writes update **org membership** (who can run settings and invites). They do **not** change who can see course content — materials and roster stay **enrollment-gated** (and `parent_student_links` where applicable).
- Billing section is P1 placeholder, **shown only to owners**.

## Data shown

- Organization **name**, **slug**, **org type**
- Current **grade scheme** and labels (K–12 preset or custom)
- Staff list: person **name** / **email**, **role** (owner | admin | instructor); owners and admins see change-role and remove actions for admins/instructors
- Last owner/admin rows explain why they can’t be removed or demoted
- Pending staff invites: **email**, **role**, copyable `/invite/<token>` link, **Resend email**, cancel
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
- Invite owners / admins / instructors by email; Course Wright emails the claim link and you can copy it again
- Pending invites: copy link again, **Resend email**, or cancel
- Change **admin ↔ instructor** for existing staff (owners and admins; owner seats stay invite-only). Membership role only — not a materials/roster access gate
- Remove admins/instructors (membership only)
- Guard: cannot remove or demote the **last remaining owner or admin**

### Billing (P1)

- Placeholder — Course Wright bills the org (Stripe hypothesis)
- **Owners only.** Admins can run the org; they cannot manage payment.

## Primary actions

- Save org settings / slug (with warning) — header Save disabled when unchanged; Cancel leaves (confirm if dirty)
- Cancel — discard unsaved changes
- Set grade scheme
- Invite staff (email + copy the claim link); cancel a pending invite; resend the email
- Change admin ↔ instructor for existing staff (membership role only)
- Remove an admin or instructor from staff (blocked when they are the last owner/admin)

## Links to

- [ORG_HOME](./ORG_HOME.md) — back to the organization
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — cross-org account settings (distinct from this page)
- [INVITE_CLAIM](./INVITE_CLAIM.md) — copied staff invite link (recipient); parent invites use the same URL from roster
- [LOGIN](./LOGIN.md) — after sign-out (if sign-out lives in chrome)
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Org creation & owners/admins, grade scheme, RBAC, admin account management. Staff change/remove is membership-only; course content stays enrollment-gated. Account-level prefs → [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md).
