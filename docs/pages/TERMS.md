# TERMS

**URL:** `/terms`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Anyone (public); required trust/legal surface for schools and families.

## Purpose

Publish Course Wright’s Terms of Use (generic pilot copy).

## Behavior

- Public legal page; renders the terms body.
- Static copy only — no product CRUD.
- Site hostname in the body comes from `VITE_PUBLIC_HOST` (`coursewright.com` or `beta.coursewright.com`).
- Legal contact → `legal@coursewright.com`.

## Data shown

- Last-updated date
- Terms sections (agreement, service, accounts, organizations, content, acceptable use, IP, third parties, privacy, pricing, disclaimers, liability, indemnity, termination, changes, governing law, general, contact)
- On-this-page anchors
- Links to privacy / cookies / home

## Contents

- Intro + sectioned body from marketing `model/termsOfUse.ts`
- Shared marketing chrome (header / footer)
- Footer **Terms of use** link is live (`ready: true`)

## Primary actions

- Read terms
- Navigate to privacy / cookies / home

## Links to

- [HOME](./HOME.md) — back to landing / footer
- [PRIVACY](./PRIVACY.md) — privacy policy
- [COOKIES](./COOKIES.md) — cookie policy
- [CONTACT](./CONTACT.md) — email directory; terms uses `legal@coursewright.com`

## Notes

- Hostname in copy: `VITE_PUBLIC_HOST`.
- Generic / pilot legal copy; a lawyer review can refine it later if needed.
- Do not invent dollar amounts for paid plans on this page beyond the liability floor already stated.
- Build prerenders static HTML for this path (with privacy/cookies) so non-JS verifiers see the terms body.
