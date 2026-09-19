# CONSTRUCTION

**URL:** *(none currently — used when a footer link has `ready: false`)*  
**URL map:** [URLS.md](../URLS.md)

## Audience

Anyone following a footer link that is not ready yet.

## Purpose

Honest placeholder for unfinished footer destinations — without inventing legal or contact copy.

## Behavior

- Public, unauthenticated.
- Heading names the requested page from `footerNav.ts`.
- Short explanation only — **no** list of other site/footer pages.
- Primary escape hatch: back to home.
- No forms, no invented policy body.
- Wired in the router only for paths listed in `constructionPaths` (`ready: false`).

## Data shown

- “In construction” status
- Name of the requested page
- Back to home action

## Contents

- Status + short explanation
- Back to home
- Shared marketing chrome (header / footer)

## Primary actions

- Go home

## Links to

- [HOME](./HOME.md)
- Live legal pages: [PRIVACY](./PRIVACY.md), [TERMS](./TERMS.md), [COOKIES](./COOKIES.md), [CONTACT](./CONTACT.md)

## Notes

Do not invent placeholder legal text. Prefer shipping a real page (like [TERMS](./TERMS.md)) over leaving a construction stub.
