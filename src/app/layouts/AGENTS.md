# AGENTS — `src/app/layouts/`

App chrome: collapsible sidebar + top bar for signed-in `/my` pages.

## Scope

- **Account shell** (`/my`, `/my/settings`, `/my/feedback`) — Organizations (nested org names) and Account. No course/roster nav.
- **Org shell** (`/my/<org-slug>/…`) — staff vs parent nav (role decides chrome, not a second app). Staff get a **Teacher / Parent view** toggle in the header.
- Collapse on desktop; overlay drawer on small screens
- Nested course / class links from domain databridge lists (org shell only)
- Staff nav includes **Calendar**, **Announcements**, **Discussions**, and **Resources** (between Courses and Roster). **Activity** is a header bell (right of the avatar), not a sidebar tab.

## Rules

- Keep this layer thin — no course/roster business rules. Lists come from domain `databridge/`.
- Parent chrome stays simpler than staff (This week, Calendar, Announcements, Discussions, **Resources** when they can see at least one, their courses). **Activity** is the header bell for staff and parents. Do not dump instructor destinations onto parent screens.
- **Parent view** for staff uses that same parent chrome. Parent-only users never see the toggle.
- Account-level chrome must not show org destinations (courses, roster, org settings).
- Account menu includes **Send feedback** (`/my/feedback` or `/my/<org-slug>/feedback`).
- Hide chrome on print routes (`PrintLayout` — no org sidebar). HTML `@media print` also hides `.cw-org-chrome`.
- Org **branding** overrides `--green` for that organization (buttons, links, sidebar, and portaled dialogs). Account chrome, login, and marketing stay Wright Green. The account list may show the org icon beside the name.
- Pass through auth `Outlet` context so `useAuthedUser` keeps working.
- Families are **not** in staff nav while the directory SPA UI is unrouted.
- Org shell mounts the Activity push prompt (`notifications/` `ActivityPushChrome`). Account shell does not. Both shells share the push provider so Account settings can turn notifications on.

## Don’t

- Put marketing or login in this shell.
- Invent extra search facets here — chrome mounts `search/`’s org search bar (staff only).
- Put Activity in the sidebar — chrome mounts `notifications/`’s header bell.
