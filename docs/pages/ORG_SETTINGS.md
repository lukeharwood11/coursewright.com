# ORG_SETTINGS

**URL:** `/my/<org-slug>/settings`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Org **owners** and **admins** (can edit). Instructors may view read-only. Parents cannot change settings. Billing, **branding**, and **customizations** are **owner-only**.

## Purpose

Configure the organization: identity, permalink, organization type, **profile** (about, address, website, contact), **school days**, grade scheme, **grading** (score scale), **branding**, **customizations**, and **collaborators** (section on this page — not a separate top-level route).


## Behavior

- Requires org **owner or admin** to save identity / profile / school days / grade scheme / type.
- Instructors see the same fields, disabled.
- Students (and staff **Student view**; linked parents inherit) are sent back to [ORG_HOME](./ORG_HOME.md).
- Save org name/metadata; changing **permalink slug** shows a warning that existing links break (no auto-redirect in P0) and requires an explicit confirmation.
- Each editable panel has its **own Save** at the bottom (no shared Save/Cancel chrome). Save is disabled when that panel has nothing changed.
- Set **organization type** (other / co-op / school / family; new orgs default to **other**), optional **profile** (about, location, website, contact email, phone), **school days** (which weekdays the org operates; default Mon–Fri), and **grade scheme** (None / K–12 / custom labels). Family is for households making materials at home. At least one school day must stay selected.
- Collaborators section on this page: invite owner / admin / instructor by email (Resend `organization-invite`) and **copy a claim link**, list pending invites. Parent invites use the same `/invite/<token>` path from [STUDENT_PROFILE](./STUDENT_PROFILE.md) / [COURSE_ROSTER](./COURSE_ROSTER.md). The list includes **parents** (not **students**) so owners/admins can **add** instructor/admin/owner **without a new invite**. That keeps parent. The role menu only offers exclusive roles. **Remove** drops the exclusive role: a parent or student membership stays; otherwise the membership ends. The last remaining owner or admin cannot be removed or demoted. Those writes update **org membership**. They do **not** change who can see course content — materials and roster stay **enrollment-gated** (and `parent_student_links` / student `user_id` where applicable).
- Billing section shows Free plan, **owners only**.
- **Branding** (owners only): optional small icon and one accent color used as the primary color inside this organization (buttons, links, sidebar). Admins and instructors see a preview and “Only owners can change branding.” Blank color keeps Wright Green. Colors that are too light for white button text, or for link text on the page background, are rejected. Remove branding restores the CW mark and Wright Green. Login, the account home, emails, and print stay Course Wright.
- **Customizations** (owners only): toggles for Discussions, Announcements, Resources, Lesson plans, Events, and Calendar view. Off hides those surfaces in nav, routes, and compose buttons; existing data stays. Admins and instructors see the list read-only (“Only owners can change customizations.”) and do not see Save or Cancel on that panel. Defaults: all on.

## Data shown

- Organization **name**, **slug**, **organization type**
- Profile: **about**, **address**, **website**, **contact email**, **phone** (optional)
- **School days** (Sun–Sat toggles; default Mon–Fri)
- Current **grade scheme** and labels (None, K–12 preset, or custom)
- Collaborators list: person **name** / **email**, governing **role** (owner | admin | instructor | parent), plus a Parent or Student badge when that additive role is also on; name opens [USER_PROFILE](./USER_PROFILE.md); owners and admins see change-role (and remove when allowed). Students are not listed
- Last owner/admin rows explain why they can’t be removed or demoted
- Pending collaborator invites: **email**, **role**, copyable `/invite/<token>` link, **Resend email**, cancel
- Billing status — Free plan (owners only)
- Branding preview: icon (or CW mark) and accent, **owners only** to edit
- Customizations: on/off for Discussions, Announcements, Resources, Lesson plans, Events, Calendar view (**owners only** to edit)

## Contents

Left **settings menu** (icons + labels) with one active panel on the right on desktop. On small screens the menu is a **Section** dropdown above the panel. Active section is reflected in `?tab=` (`organization` default / omitted; `profile`; `grading`; `branding`; `customizations`; `collaborators`; `billing` when shown). Every editable panel owns its Save at the bottom of that panel. Collaborators and Billing have no Save — their actions are inline (invite, change role, remove).

### Organization

- Organization name
- **Permalink slug** — editable; UI **must warn** that changing it breaks existing links (no auto-redirect in P0)
- Organization type: co-op, school, or family
- **School days** — circle toggles Sunday–Saturday under web address; info hint: days this organization usually operates. Default Monday–Friday. Lesson-plan compose uses these days; staff can still add another weekday on a plan
- **School days / Home days** — segmented tabs with the same weekday circle toggles. Defaults to **School days**; home days start with none selected. Calendar and lesson plans show cap / home icons on matching weekdays
- **Grade scheme** — None, K–12, or custom labels (same panel). None removes grade fields from students and courses and clears stored grade metadata when saved
- **Save organization** — owners and admins; disabled when unchanged

### Grading

Owners and admins edit one org-wide score scale. Instructors see the same fields disabled (“Only owners and admins can change grading.”). This is not the age-level grade scheme.

- Mode: **Points only** (`none`, the default for a new org), **Letters**, or **Pass / fail**
- Pass / fail: one inclusive percent
- Letters: pick a **preset** (Classic A–F at 92, A/AB/B…, or A+/A/A-…), see the scale as **range chips**, and open **Customize** for a compact letter / min-% table when needed. One band must start at 0. **Save grading** writes the scale
- Teachers consume the scale on quizzes, the gradebook, and report cards. They do not edit it

### Profile

- Optional **about** (who you are / how the co-op works)
- Optional **location / address** (free text)
- Optional **website** (external URL)
- Optional **contact email** (org inbox, not a login)
- Optional **phone**
- **Save profile** — owners and admins; disabled when unchanged

Shown on [ORG_HOME](./ORG_HOME.md) when any field is set. Not a public marketing page.

### Collaborators / roles

- List owners, admins, instructors, and parents. Do not list students
- Invite owners / admins / instructors by email; Course Wright emails the claim link and you can copy it again
- Pending invites: copy link again, **Resend email**, or cancel
- Change the **exclusive** role: owners may set instructor / admin / owner; admins may set instructor / admin. Promoting a parent adds that role and keeps parent. Do not offer parent or student as replacements, and do not promote students from this list
- Remove drops the exclusive role (confirm). Parent or student stays when that flag is set; otherwise the membership ends
- Guard: cannot remove or demote the **last remaining owner or admin**
- Existing **owner** rows stay badge-only (promote others to owner; don’t demote owners from this list)

### Branding (owners only)

- Small icon upload (PNG, JPEG, or WebP, under 256 KB) and remove icon
- One accent color (`#RRGGBB`) or blank for Wright Green
- Preview of the sidebar mark and an active nav chip
- **Save**, **Remove branding**, and **Reset** (Reset discards queued icon/color changes; enabled only when something changed). Action buttons stay on one row.

### Customizations (owners only)

- Toggle **Discussions**, **Announcements**, **Resources**, **Lesson plans**, **Events**, **Calendar view**
- **Save customizations**. Non-owners do not see Save on this panel
- Turning a feature off hides it in the product; it does not delete existing content

### Billing (P1)

- Shows **You’re on the Free plan.** (owners only). Paid plans later.

## Primary actions

- Save organization (owners and admins; disabled when unchanged)
- Save profile (owners and admins; disabled when unchanged)
- Set school days / grade scheme (via Save organization)
- Save grading (owners and admins)
- Save, remove branding, or reset queued branding changes (owners only)
- Save customizations (owners only)
- Invite collaborators (email + copy the claim link); cancel a pending invite; resend the email
- Change the exclusive role for existing collaborators (promoting a parent keeps parent)
- Remove an admin or instructor (blocked when they are the last owner/admin). A parent or student membership stays

## Links to

- [ORG_HOME](./ORG_HOME.md) — back to the organization
- [USER_PROFILE](./USER_PROFILE.md) — collaborator name
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md) — cross-org account settings (distinct from this page)
- [INVITE_CLAIM](./INVITE_CLAIM.md) — copied staff invite link (recipient); parent invites use the same URL from roster
- [LOGIN](./LOGIN.md) — after sign-out (if sign-out lives in chrome)
- [ORG_ROSTER](./ORG_ROSTER.md) — Students hub can link here on `?tab=grading`
- Via org chrome: [ORG_HOME](./ORG_HOME.md), [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [TEMPLATE_LIST](./TEMPLATE_LIST.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD

## Notes

[FEATURES.md](../FEATURES.md) — Org creation & owners/admins, grade scheme, RBAC, admin account management. Staff change/remove is membership-only; course content stays enrollment-gated. Account-level prefs → [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md).
