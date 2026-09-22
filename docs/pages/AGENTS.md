# AGENTS — `docs/pages/`

Page outlines for the SPA. Each file is one screen.

## Pairing with URLS.md

**`URLS.md` and this folder must match.** Full rules: [docs/AGENTS.md](../AGENTS.md#urlsmd-and-pages-must-match).

- Locked route in [URLS.md](../URLS.md) → matching ALL_CAPS file here
- Page file → **URL** line(s) at top + link to `URLS.md`
- No page file for TBD routes until the path is locked
- Update both docs in the same change when routes change

## File rules

- Filename = page name in ALL_CAPS (e.g. `ORG_HOME.md`).
- First content after the `# TITLE`: **URL** (and alternate URLs), then **URL map** link.
- Outline from [FEATURES.md](../FEATURES.md) — do not invent behavior; use TBD when undecided.
- Index: [README.md](./README.md).

### Required sections (every page)

| Section | Owns |
|---------|------|
| **Audience** | Who uses this screen |
| **Purpose** | Why the screen exists |
| **Behavior** | What happens on load, interactions, role differences, redirects, gates, empty/error paths |
| **Data shown** | What fields / entities / derived values are **displayed** (and from what domain concepts). Note writeable vs read-only when useful |
| **Contents** | Layout / UI regions (optional detail beyond Behavior + Data shown) |
| **Primary actions** | Main verbs |
| **Links to** | Outbound navigation — see below |
| **Notes** | FEATURES / TBD pointers |

**Behavior** and **Data shown** are required — agents must not ship a page outline that only lists nav without saying what the user sees and how the screen acts.

### Outbound links (required)

Every page file **must** include a **Links to** section that lists **every other app page this screen navigates to**.

Rules:

1. Use markdown links to the matching file in this folder — e.g. `[COURSE](./COURSE.md)`, not bare paths alone.
2. Cover primary CTAs, nav, list row opens, “back to…”, post-auth redirects, and create flows that land on another page.
3. If the destination route is still TBD (invite, share entry, search), note it under Links to as TBD — do **not** invent a page file.
4. Keep **Links to** in sync when you add/remove navigation in Contents or Primary actions.
5. Shared chrome (e.g. org nav on many instructor pages) — list the destinations that chrome exposes from that screen (or say “via org chrome: …” with the same `./PAGE.md` links).

### Org chrome (instructor / admin)

Org pages share a **collapsible sidebar** (overlay drawer on small screens). When a page says **via org chrome**, expand Links to with at least:

- [ORG_HOME](./ORG_HOME.md)
- [CALENDAR](./CALENDAR.md)
- [ANNOUNCEMENTS](./ANNOUNCEMENTS.md)
- [DISCUSSIONS](./DISCUSSIONS.md) — **P1**
- [ACTIVITY](./ACTIVITY.md) — **P1** (header bell, not a sidebar tab)
- [COURSE_LIST](./COURSE_LIST.md)
- [RESOURCES](./RESOURCES.md) — **P1a** (between Courses and Roster)
- [ORG_ROSTER](./ORG_ROSTER.md)
- [ORG_SETTINGS](./ORG_SETTINGS.md)
- [ORG_PICKER](./ORG_PICKER.md) — switch org
- [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md)
- [FEEDBACK](./FEEDBACK.md) — **Send feedback** in the account menu
- Search — staff chrome overlay (pages / courses / materials); dedicated route still TBD

[TEMPLATE_LIST](./TEMPLATE_LIST.md) is **P1** — do not put templates in P0 org chrome.
[FAMILIES](./FAMILIES.md) / [FAMILY](./FAMILY.md) remain product outlines but are **not currently in org chrome or routes**.

Parent chrome is simpler — see [ORG_HOME](./ORG_HOME.md) parent variant; do not dump instructor nav onto parent screens. Parent sidebar: This week, Calendar, Announcements (red unread count), Discussions (**P1**, red unread count), **Resources** when they can see at least one published item, their courses, Progress. **Activity** is a header bell (right of the avatar) with a red unread count. Staff **Parent view** uses the same parent chrome; the toggle lives in the org header (not on print screens).
