# AGENTS — `docs/`

Product and planning documentation. Runtime code stays in `src/`, `supabase/`, `infra/`.

## Contents

| File / folder | Owns |
|---------------|------|
| `VISION.md` | Product vision |
| `FEATURES.md` | P0/P1/P2 behavior + **Status** progress — source of truth |
| `BRANDING.md` | Name, voice, vocabulary |
| `STYLE_GUIDE.md` | Visual system |
| `STACK.md` | Technologies |
| `FILE_STORAGE.md` | File storage + audio/video playback design |
| `ARCHITECTURE.md` | Screaming Architecture, flows |
| `STRUCTURE.md` | Repo folder layout |
| `URLS.md` | UI URL map — routes by feature/page |
| `pages/` | Per-page outlines (`HOME.md`, `ORG_HOME.md`, …) |
| `HUMAN_NEEDED.md` | Human/admin cloud todos |
| `database/` | Schema planning (`SCHEMA.md`) |

## Rules

- Keep cross-links **inside `docs/`** as same-folder or `./database/…` relatives.
- Link to root [AGENTS.md](../AGENTS.md) / [README.md](../README.md) with `../`.
- Do not invent product behavior here that isn’t decided — use TBD / ask.
- When starting or finishing a feature, update **Status** / Notes in `FEATURES.md` (see status key at top of that file).
- When agents are blocked on AWS/Supabase/Google/DNS, update `HUMAN_NEEDED.md` (instructions at top of that file).

### `URLS.md` and `pages/` must match

[URLS.md](./URLS.md) and [pages/](./pages/) are a **paired source of truth**:

| Doc | Owns |
|-----|------|
| `URLS.md` | Path strings, nesting rules, which screens exist |
| `pages/<PAGE>.md` | What’s on that screen (audience, contents, actions) |

**Keep them in sync:**

1. Every **locked** route in `URLS.md` has a matching `pages/*.md` file (ALL CAPS name).
2. Every page file lists its **URL(s)** at the top and links back to `URLS.md`.
3. `URLS.md` tables link to the page file in a **Page** column.
4. `pages/README.md` lists the same set of pages/URLs as the locked rows in `URLS.md`.
5. If you add, rename, or remove a route — update **both** docs in the same change. If a URL is still TBD, do **not** invent a page file until the path is locked (note the gap in `URLS.md` open questions instead).
6. Page outlines must not invent product behavior; defer to [FEATURES.md](./FEATURES.md).
7. Each `pages/*.md` file must list outbound navigation in a **Links to** section, with markdown links to the other page files in `pages/` — see [pages/AGENTS.md](./pages/AGENTS.md#outbound-links-required).
8. Each page outline must include **Behavior** (how the screen acts) and **Data shown** (what is displayed) — see [pages/AGENTS.md](./pages/AGENTS.md#required-sections-every-page).

## Don’t

- Move these files back to the repo root.
- Put migration SQL here — that belongs in `supabase/migrations/`.
- Let `URLS.md` and `pages/` drift (different paths, orphan pages, or locked routes with no outline).
