# ORG_SETTINGS

**URL:** `/my/<org-slug>/settings`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Org **owners** and **admins** (can edit). Instructors may view read-only. Parents cannot change settings. Billing, **branding**, and **customizations** are **owner-only**.

## Purpose

Configure the organization: identity, permalink, organization type, **profile** (about, address, website, contact), **school days**, grade scheme, **branding**, **customizations**, and **collaborators** (section on this page — not a separate top-level route).


## Behavior

- Requires org **owner or admin** to save identity / profile / school days / grade scheme / type.
- Instructors see the same fields, disabled.
- Students (and staff **Student view**; linked parents inherit) are sent back to [ORG_HOME](./ORG_HOME.md).
- Save org name/metadata; changing **permalink slug** shows a warning that existing links break (no auto-redirect in P0) and requires an explicit confirmation.
- **Save** and **Cancel** sit at the top-right of the content panel (aligned with that column). Save is disabled when nothing changed; Cancel goes back (confirms first if there are unsaved changes).
- Set **organization type** (other / co-op / school / family; new orgs default to **other**), optional **profile** (about, location, website, contact email, phone), **school days** (which weekdays the org operates; default Mon–Fri), and **grade scheme** (K–12 / custom labels). Family is for households making materials at home. At least one school day must stay selected.
- Collaborators section on this page: invite owner / admin / instructor by email (Resend `organization-invite`) and **copy a claim link**, list pending invites. Parent invites use the same `/invite/<token>` path from [STUDENT_PROFILE](./STUDENT_PROFILE.md) / [COURSE_ROSTER](./COURSE_ROSTER.md). The list includes **parents** already in the org so owners/admins can **promote** them to instructor/admin/owner **without a new invite**. Owners and admins **change roles** (including demote to **parent** when the person has a linked student) and **remove** admins/instructors who have no linked student; the last remaining owner or admin cannot be removed or demoted. Those writes update **org membership** (who can run settings and invites). They do **not** change who can see course content — materials and roster stay **enrollment-gated** (and `parent_student_links` where applicable).
- Billing section shows Free plan, **owners only**.
- **Branding** (owners only): optional small icon and one accent color used as the primary color inside this organization (buttons, links, sidebar). Admins and instructors see a preview and “Only owners can change branding.” Blank color keeps Wright Green. Colors that are too light for white button text, or for link text on the page background, are rejected. Remove branding restores the CW mark and Wright Green. Login, the account home, emails, and print stay Course Wright.
- **Customizations** (owners only): toggles for Discussions, Announcements, Resources, Lesson plans, Events, and Calendar view. Off hides those surfaces in nav, routes, and compose buttons; existing data stays. Admins and instructors see the list read-only (“Only owners can change customizations.”) and do not see Save or Cancel on that panel. Defaults: all on.

## Data shown

- Organization **name**, **slug**, **organization type**
- Profile: **about**, **address**, **website**, **contact email**, **phone** (optional)
- **School days** (Sun–Sat toggles; default Mon–Fri)
- Current **grade scheme** and labels (K–12 preset or custom)
- Collaborators list: person **name** / **email**, **role** (owner | admin | instructor | parent); name opens [USER_PROFILE](./USER_PROFILE.md); owners and admins see change-role (and remove when allowed)
- Last owner/admin rows explain why they can’t be removed or demoted
- Pending collaborator invites: **email**, **role**, copyable `/invite/<token>` link, **Resend email**, cancel
- Billing status — Free plan (owners only)
- Branding preview: icon (or CW mark) and accent, **owners only** to edit
- Customizations: on/off for Discussions, Announcements, Resources, Lesson plans, Events, Calendar view (**owners only** to edit)

## Contents

Left **settings menu** (icons + labels) with one active panel on the right on desktop. On small screens the menu is a **Section** dropdown above the panel. Active section is reflected in `?tab=` (`organization` default / omitted; `profile`; `branding`; `customizations`; `collaborators`; `billing` when shown). Save / Cancel sit at the top-right of the content panel (aligned with that column’s right edge) whenever the viewer can edit organization or profile settings, and on Customizations when the viewer is an owner. Non-owners on Customizations do not see that Save or Cancel. Branding and Customizations keep their own Save actions (owners only).

### Organization

- Organization name
- **Permalink slug** — editable; UI **must warn** that changing it breaks existing links (no auto-redirect in P0)
- Organization type: co-op, school, or family
- **School days** — circle toggles Sunday–Saturday under web address; info hint: days this organization usually operates. Default Monday–Friday. Lesson-plan compose uses these days; staff can still add another weekday on a plan
- **Grade scheme** — K–12 or custom labels (same panel)

### Profile

- Optional **about** (who you are / how the co-op works)
- Optional **location / address** (free text)
- Optional **website** (external URL)
- Optional **contact email** (org inbox, not a login)
- Optional **phone**

Shown on [ORG_HOME](./ORG_HOME.md) when any field is set. Not a public marketing page.

### Collaborators / roles

- List owners, admins, instructors, and parents
- Invite owners / admins / instructors by email; Course Wright emails the claim link and you can copy it again
- Pending invites: copy link again, **Resend email**, or cancel
- Change **roles** for existing members: owners may set instructor / admin / owner; admins may set instructor / admin; either may set **parent** only when that person has a linked student in the org. Promote parent → staff with no new invite. Membership role only — not a materials/roster access gate
- Remove admins/instructors who have **no** linked student (membership only; confirm). If they have a linked student, demote to parent instead
- Guard: cannot remove or demote the **last remaining owner or admin**
- Existing **owner** rows stay badge-only (promote others to owner; don’t demote owners from this list)

### Branding (owners only)

- Small icon upload (PNG, JPEG, or WebP, under 256 KB) and remove icon
- One accent color (`#RRGGBB`) or blank for Wright Green
- Preview of the sidebar mark and an active nav chip
- **Save branding** and **Remove branding** — separate from the panel Save for Organization / Profile

### Customizations (owners only)

- Toggle **Discussions**, **Announcements**, **Resources**, **Lesson plans**, **Events**, **Calendar view**
- **Save customizations** — separate from the panel Save for Organization / Profile. Non-owners do not see Save or Cancel on this panel
- Turning a feature off hides it in the product; it does not delete existing content

### Billing (P1)

- Shows **You’re on the Free plan.** (owners only). Paid plans later.

## Primary actions

- Save org settings / slug (with warning) — panel Save disabled when unchanged; Cancel leaves (confirm if dirty)
- Cancel — discard unsaved changes
- Set profile fields
- Set school days
- Set grade scheme
- Save branding or remove branding (owners only)
- Save customizations (owners only). Non-owners on this panel do not see Save or Cancel
- Invite collaborators (email + copy the claim link); cancel a pending invite; resend the email
- Change roles for existing collaborators (including promote parent → staff and demote staff → parent when linked to a student)
- Remove an admin or instructor with no linked student (blocked when they are the last owner/admin)

## Links to

- [ORG_HOME](./ORG_HOME.md) — back to the organization
- [USER_PROFILE](./USER_PROFILE.md) — collaborator name
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — cross-org account settings (distinct from this page)
- [INVITE_CLAIM](./INVITE_CLAIM.md) — copied staff invite link (recipient); parent invites use the same URL from roster
- [LOGIN](./LOGIN.md) — after sign-out (if sign-out lives in chrome)
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Org creation & owners/admins, grade scheme, RBAC, admin account management. Staff change/remove is membership-only; course content stays enrollment-gated. Account-level prefs → [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md).
