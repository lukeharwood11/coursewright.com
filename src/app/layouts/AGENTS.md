# AGENTS — `src/app/layouts/`

App chrome: collapsible sidebar + top bar for signed-in `/my` pages.

## Scope

- **Account shell** (`/my`, `/my/settings`) — Organizations (nested org names) and Account. No course/roster nav.
- **Org shell** (`/my/<org-slug>/…`) — staff vs parent nav (role decides chrome, not a second app). Staff get a **Teacher / Parent view** toggle in the header.
- Collapse on desktop; overlay drawer on small screens
- Nested course / class links from domain databridge lists (org shell only)
- Staff nav includes **Calendar**, **Announcements**, and **Discussions** (**P1**, when that feature leaves `in design`)

## Rules

- Keep this layer thin — no course/roster business rules. Lists come from domain `databridge/`.
- Parent chrome stays simpler than staff (This week, Calendar, Announcements, Discussions (**P1**), their courses, Progress). Do not dump instructor destinations onto parent screens.
- **Parent view** for staff uses that same parent chrome. Parent-only users never see the toggle.
- Account-level chrome must not show org destinations (courses, roster, org settings).
- Hide chrome on print routes (`PrintLayout` — no org sidebar). HTML `@media print` also hides `.cw-org-chrome`.
- Pass through auth `Outlet` context so `useAuthedUser` keeps working.
- Families are **not** in staff nav while the directory SPA UI is unrouted.

## Don’t

- Put marketing or login in this shell.
- Invent extra search facets here — chrome mounts `search/`’s org search bar (staff only).
