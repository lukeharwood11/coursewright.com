# AGENTS — `src/app/layouts/`

App chrome: collapsible sidebar + top bar for signed-in `/my` pages.

## Scope

- **Account shell** (`/my`, `/my/settings`, `/my/feedback`) — Organizations (nested org names) and Account. No course/roster nav.
- **Org shell** (`/my/<org-slug>/…`) — staff vs parent nav (role decides chrome, not a second app). Staff writers get a **Teacher / Preview** toggle in the header (plus **Parent** / **Student** when additive flags apply; mobile Select when 3+ modes).
- Collapse on desktop; overlay drawer on small screens
- Nested course / class links from domain databridge lists (org shell only)
- Staff nav includes **Calendar**, **Announcements**, **Discussions**, and **Resources** (between Courses and Students) when those org customizations are on. The people item is **Students** (`/students`). There is no top-level **Roster** or **Records** item. Classes are a tab on Students, not sidebar children. **Activity** is a header bell (right of the avatar), not a sidebar tab.
- Shell is viewport-locked (`h-dvh`): sidebar + top bar stay put; **`<main>`** scrolls (`#app-shell-main`). Pages that fill the pane (Calendar, Resources browse, discussion thread) use `h-full` / internal scroll — not `100dvh` calcs that fight the chrome.
- Category landing pages (org home, courses, calendar, announcements, discussions, resources, roster, activity, org/account settings, feedback, org picker) use compact page padding `px-5 py-4 md:px-8`. Detail screens with **DetailPageHeader** keep their own chrome spacing.

## Rules

- Keep this layer thin — no course/roster business rules. Lists come from domain `databridge/`.
- Student chrome stays simpler than staff (This week, Calendar, Announcements, Discussions when enabled, **Progress**, **Resources** when enabled and they can see at least one, **Courses** → list + nested enrolled courses). Parents use staff-shaped people chrome labeled **Students**, limited to linked students. **Activity** is the header bell for staff and the student experience. Do not dump instructor destinations onto student screens.
- **Preview / Parent / Student** modes for staff use student chrome. Preview omits **Progress** (redirects home); Student mode uses **Progress**; Parent uses the **Students** hub. Parent-role users never see the toggle.
- Account-level chrome must not show org destinations (courses, roster, org settings).
- Account menu includes **Send feedback** (`/my/feedback` or `/my/<org-slug>/feedback`).
- Hide chrome on print routes (`PrintLayout` — no org sidebar). HTML `@media print` also hides `.cw-org-chrome`.
- Org **branding** overrides `--green` for that organization (buttons, links, sidebar, and portaled dialogs). Account chrome, login, and marketing stay Wright Green. The account list may show the org icon beside the name.
- Pass through auth `Outlet` context so `useAuthedUser` keeps working.
- Families are **not** in staff nav while the directory SPA UI is unrouted.
- Org shell mounts the Activity push prompt (`notifications/` `ActivityPushChrome`). Account shell does not. Both shells share the push provider so Account settings can turn notifications on.

## Don’t

- Put marketing or login in this shell.
- Invent extra search facets here — chrome mounts `search/`’s org search bar for all org members.
- Put Activity in the sidebar — chrome mounts `notifications/`’s header bell.
