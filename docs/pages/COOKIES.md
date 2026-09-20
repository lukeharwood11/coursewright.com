# COOKIES

**URL:** `/cookies`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Anyone (public); companion to the privacy policy for cookie / storage practices.

## Purpose

Explain how Course Wright uses cookies and similar technologies (including PostHog when analytics is enabled).

## Behavior

- Public legal page; static copy only.
- Host from `VITE_PUBLIC_HOST`; privacy/legal contact → `legal@coursewright.com`.
- Cross-links to [PRIVACY](./PRIVACY.md).

## Data shown

- Last-updated date
- Sections: what cookies are, essential (auth/session via Supabase), analytics (PostHog when enabled), what we do not use, how to manage, changes, contact
- Link to privacy policy

## Contents

- Body from marketing `model/cookiePolicy.ts`
- Shared marketing chrome
- Footer **Cookie policy** link is live (`ready: true`)

## Primary actions

- Read policy
- Open privacy policy / home

## Links to

- [HOME](./HOME.md)
- [PRIVACY](./PRIVACY.md)
- [TERMS](./TERMS.md)
- [CONTACT](./CONTACT.md) — general/support; cookie questions use `legal@` on this page

## Notes

Align with [STACK.md](../STACK.md). Do not claim session replay until enabled. Do not mention other deploy tiers in the body.
