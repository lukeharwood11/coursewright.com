# AGENTS — `src/organizations/`

Org create, settings, grade scheme, permalink slug, admin invites, staff role changes / removals. Creator = first **owner**.

## Scope

- Org picker (`/my`) and org home (`/my/<org-slug>`)
- Create organization; org settings (`/my/<org-slug>/settings`)
- **Permalink `slug`** — generated on create; changing it must warn that existing links break
- Grade scheme (K–12 / Custom) and org type (co-op / micro-school)
- Admin invites (email via Resend `organization-invite` + copyable claim link)
- Parent invites use the **same** `/invite/<token>` claim path (`role = parent`); create UI lives in `roster/`. The claim page loads unsigned so the invited email is obvious before signup/login.
- **Staff management** — change admin ↔ instructor; remove admins/instructors (not the last owner or admin). **Membership table only** — do not wire staff role into materials/roster RLS
- Not: course builder, roster details (those are sibling domains)

## Rules

- Page folders per screen (`org-picker/`, `org-home/`, `org-settings/`, `claim-invite/`). Shared `model/` and `databridge/`.
- PostgREST + RLS for normal org CRUD; Functions only if invite claim needs privileged writes.
- Anyone can create an org ([FEATURES.md](../../docs/FEATURES.md)).
- Slug uniqueness is enforced in the DB; never invent redirects for old slugs unless FEATURES says so.
- Parent “this week” on org home uses `parent/` model + databridge and the shared `calendar/` week view. Staff **Parent view** renders that same home.
- **Owners and admins** can update org settings. Instructors/parents cannot (RLS + UI).
- **Billing is owner-only** — do not show billing controls to admins. Billing UI lives in `billing/`.

## Don’t

- Put student roster UI here — use `roster/`.
- Put billing UI here until P1 — use `billing/` (owner-only placeholder is OK on org settings).
- Allow removing or demoting the last owner or admin.
- Add a staff-role check to materials or roster RLS. Content access stays enrollment-gated (`parent_student_links` where applicable). Role change only affects who can manage the org.
