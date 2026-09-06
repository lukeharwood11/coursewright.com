# AGENTS — `src/app/layouts/`

App chrome: collapsible sidebar + top bar for signed-in `/my` pages.

## Scope

- **Account shell** (`/my`, `/my/settings`) — Organizations (nested org names) and Account. No course/roster/family nav.
- **Org shell** (`/my/<org-slug>/…`) — staff vs parent nav (role decides chrome, not a second app)
- Collapse on desktop; overlay drawer on small screens
- Nested course / family links from domain databridge lists (org shell only)

## Rules

- Keep this layer thin — no course/roster business rules. Lists come from domain `databridge/`.
- Parent chrome stays simpler than staff (This week, their courses, Progress). Do not dump instructor destinations onto parent screens.
- Account-level chrome must not show org destinations (courses, roster, families, org settings).
- Hide chrome when printing.
- Pass through auth `Outlet` context so `useAuthedUser` keeps working.

## Don’t

- Put marketing or login in this shell.
- Invent extra widgets or search behavior — search still toasts until that feature ships, and only on org pages.
