# PRIVACY

**URL:** `/privacy`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Anyone (public); required trust/legal surface for schools and families.

## Purpose

Publish the privacy policy for Course Wright.

## Behavior

- Public legal page; renders the privacy policy body.
- Static copy only — no product CRUD.
- Highlights product analytics via **PostHog** when enabled (page views / leaves, client error reporting), plus standard account, org content, and hosting practices (Supabase, AWS, Google sign-in).
- Includes a dedicated **Google user data** section (access / use / store / share / retain-delete / Limited Use) required for Google OAuth branding verification.
- Site hostname in the policy body comes from `VITE_PUBLIC_HOST` (`coursewright.com` or `beta.coursewright.com`).

## Data shown

- Last-updated date
- Privacy policy sections (who we are, collection, use, **Google user data**, PostHog analytics, providers, cookies, sharing, retention, security, children, choices, international transfers, changes, contact)
- On-this-page anchors
- Link back to home / about

## Contents

- Policy intro + sectioned body from marketing `model/privacyPolicy.ts`
- Shared marketing chrome (header / footer)
- Footer **Privacy** link is live (`ready: true`)

## Primary actions

- Read policy
- Navigate to home / about

## Links to

- [HOME](./HOME.md) — back to landing / footer
- [ABOUT](./ABOUT.md) — about
- [CONTACT](./CONTACT.md) — email directory; privacy uses `legal@coursewright.com`
- [TERMS](./TERMS.md) — terms of use
- [COOKIES](./COOKIES.md) — cookie policy (linked from privacy cookies section)

## Notes

- Hostname in copy: `VITE_PUBLIC_HOST` (set in `.env.testing` / `build-spa.sh` from Terraform `site_domain`).
- Align disclosures with [STACK.md](../STACK.md). Do not claim PostHog session replay until enabled. Policy body should not mention other deploy tiers.
- This is product-facing policy copy for the pilot; a lawyer review can refine it later if needed.
- Build prerenders static HTML for this path (and terms/cookies) so crawlers/verifiers that do not execute JavaScript still see the policy body. SPA JS still mounts for interactive visits after deploy.
- Google Cloud OAuth branding verification looks for explicit **Google user data** disclosures (not only a generic privacy policy). Keep section `google-user-data` in `privacyPolicy.ts` aligned with actual Sign in with Google scopes (basic profile/email via Supabase Auth).
