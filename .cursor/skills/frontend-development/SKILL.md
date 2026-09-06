---
name: frontend-development
description: Builds Course Wright SPA screens and UI with Screaming Architecture, UI/hooks/business-logic/databridge separation, Supabase-first data access, and STYLE_GUIDE/BRANDING. Use when implementing or changing pages, components, routes, domain UI, hooks, business logic, databridge/API layers, layout chrome, or frontend styling — or when the user mentions React, Tailwind, components, hooks, or UI work.
---

# Frontend development

## Before coding

1. **Behavior** — Read the relevant sections of [docs/FEATURES.md](../../../docs/FEATURES.md). Do not invent product behavior; mark undecided items TBD or ask.
2. **Screen** — Read the matching outline in [docs/pages/](../../../docs/pages/) (index: [README.md](../../../docs/pages/README.md)). Match **Behavior**, **Data shown**, **Contents**, **Primary actions**, and **Links to**.
3. **Look & voice** — Follow [docs/STYLE_GUIDE.md](../../../docs/STYLE_GUIDE.md) and product vocabulary in [docs/BRANDING.md](../../../docs/BRANDING.md).
4. **Structure** — Place code per [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) / [docs/STRUCTURE.md](../../../docs/STRUCTURE.md). Follow the nearest domain `AGENTS.md`.

Routes must stay aligned with [docs/URLS.md](../../../docs/URLS.md) and `docs/pages/` — update both in the same change if a path changes.

**Simpler is better.** Prefer the smallest clear split that preserves separation of concerns. Do not add layers, abstractions, or files “for architecture” when a direct approach is enough.

## Screaming Architecture

`src/` must scream Course Wright domains, not frameworks. Full rules: [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md).

| Put here | Not here |
|----------|----------|
| `organizations/`, `roster/`, `courses/`, `course-templates/`, `units/`, `materials/`, `parent/`, `print/`, `sharing/`, `auth/`, … | Top-level `components/`, `hooks/`, `services/`, `features/`, `pages/` |
| Domain **page folders** (each screen screams its name) + domain `model/`, `databridge/` | Flat domain `pages/`, `components/`, `hooks/` buckets |
| Shared primitives in `ui/`; shells/router in `app/` | Course/roster flows in `ui/` |

Prefer product terms from BRANDING (Organization, Template, Course, Unit, Material, Roster, Print) — never “Export” for print.

**Page folders scream the screen.** Do not collect all pages, components, and hooks into sibling framework buckets under the domain. Each route-level screen is a folder named for the product page; its UI pieces and hooks live inside it.

## Separation of concerns

Keep **UI**, **business logic**, **hooks**, and **database access** in separate files.

```text
UI (<page>/ + <page>/components/)
  → <page>/hooks/   # React boundary: call model + databridge, expose UI-ready state
  → model/          # pure business logic (no React, no Supabase) — domain-shared
  → databridge/     # database / Supabase requests only — domain-shared
  → infrastructure/supabase  # shared client (details)
```

| Layer | Owns | Must not own |
|-------|------|--------------|
| **`<page>/` UI** | Page markup + colocated `components/` | Business rules, Supabase calls, query keys |
| **`<page>/hooks/`** | Wire model + databridge into React for that page | JSX; raw `supabase.from` (call databridge instead) |
| **`model/`** | Pure domain rules, transforms, validation, derived values | React; network I/O |
| **`databridge/`** | Supabase PostgREST / Storage / Function invokes for this domain | UI; product policy beyond mapping request ↔ data |

**Rules:**

1. **UI and business logic are never in the same file.** Page/components render; `model/` decides.
2. **Hooks bring business logic into the app.** The page imports its colocated hooks (and presentational children), not `model/` + `databridge/` directly — unless the screen is trivially presentational with no logic.
3. **API / DB requests stay out of business logic.** `model/` stays pure; `databridge/` owns all Supabase (and Function) I/O.
4. **Prefer Supabase directly** via the shared client for CRUD when RLS can enforce rules. Use Edge Functions only for multi-step, privileged, or secret-bearing jobs ([docs/STACK.md](../../../docs/STACK.md)).
5. **Databridge is the only domain layer that talks to the database.** Screens and model never import `infrastructure/supabase` ad hoc.
6. **Colocate page UI.** A page’s components and hooks live under that page folder — not in domain-level `components/` or `hooks/`.

**Domain folder shape:**

```text
<domain>/
├── index.ts                 # public exports
├── <page>/                  # one folder per screen — screams the page
│   ├── <Page>.tsx           # route-level screen (UI only)
│   ├── components/          # UI used only by this page
│   └── hooks/               # React adapters for this page
├── model/                   # pure business logic (shared across pages in domain)
├── databridge/              # Supabase / Function requests for this domain
└── stores/                  # optional Zustand UI state for this domain only
```

Example (`courses/`):

```text
courses/
├── course/
│   ├── CoursePage.tsx
│   ├── components/
│   │   ├── UnitList.tsx
│   │   └── CourseHeader.tsx
│   └── hooks/
│       └── useCourse.ts
├── course-settings/
│   ├── CourseSettingsPage.tsx
│   ├── components/
│   └── hooks/
├── model/
└── databridge/
```

- Truly shared cross-page UI in the same domain: keep it rare; prefer extracting only when a second page needs it (still named for the product concept, not a dump `components/`).
- Cross-domain chrome → `ui/` or `app/layouts/`.
- TanStack Query = server/cache state (usually in page hooks, fetching via databridge).
- Zustand = ephemeral UI state only (modals, selection).
- One SPA; role chrome in `app/layouts/` — do not split a parent app.

### Minimal example flow

```text
courses/course/CoursePage.tsx
  → courses/course/hooks/useCourse.ts
    → courses/model/… + courses/databridge/…
```

## Style & branding

Canonical sources: [docs/STYLE_GUIDE.md](../../../docs/STYLE_GUIDE.md), [docs/BRANDING.md](../../../docs/BRANDING.md).

- **Tailwind** for layout/spacing/typography; brand tokens via CSS variables from `src/styles/index.css`.
- Reuse `src/ui/` primitives before inventing parallel controls.
- Wright Green primary; amber sparingly; Slate for system/info.
- Lora for wordmark + page titles only; Manrope for product chrome.
- Sentence case; badges for status; borders over heavy shadows.
- Parent UX is simpler than instructor — tech-averse parents must understand the screen immediately.
- Print in the open (**Print** / **Print unit** / **Print this week**) — never behind overflow or labeled Export.
- Mobile-usable responsive web; honor `prefers-reduced-motion`.
- Do not invent purple/terracotta/Inter looks, pictorial logo marks, or LMS jargon.

## Safe TypeScript

- Keep `strict` green — `tsc -b` must pass.
- No `any`. Prefer `unknown` + narrowing, or generated Supabase types.
- Explicit props types; prefer `type` for props/unions.
- Narrow role, status, and content-kind unions at boundaries.
- Prefer `import type` for type-only imports.
- Do not silence errors with non-null assertions or `@ts-expect-error` unless unavoidable and commented why.
- Prefer early returns over deep nesting.

## Component size

Keep components focused. Split before a file becomes hard to scan.

**Split when:**

- ~150+ lines of JSX, or multiple unrelated UI regions in one file
- Distinct visual regions that can own their own props
- Repeated blocks that differ only by data
- Mix of orchestration and dense markup — page uses a hook; children present

**How:** Colocate under that page’s `components/`; name after the product concept; pass narrow props; shared chrome → `ui/` or `app/layouts/`.

## Workflow checklist

```
Frontend task:
- [ ] FEATURES.md covers this behavior (phase + rules)
- [ ] docs/pages/<PAGE>.md matches behavior, data, actions, links
- [ ] Code lives in the correct screaming domain + page folder
- [ ] Page components/hooks are colocated under that page (not domain buckets)
- [ ] UI / hooks / model / databridge stay in separate files
- [ ] Hooks are the React entry to business logic; databridge owns Supabase
- [ ] Prefer direct Supabase (PostgREST) over Functions when RLS is enough
- [ ] STYLE_GUIDE + BRANDING vocabulary/voice applied
- [ ] Tailwind + tokens; ui/ primitives reused
- [ ] Safe TypeScript (no any; unions narrowed)
- [ ] Kept it as simple as the separation allows
```

## Anti-patterns

- Inventing P1/P2 or out-of-scope behavior on a P0 screen
- Framework-first folders at `src/` top level (`components/`, `hooks/`, `pages/` as primary trees)
- Domain-level `pages/`, `components/`, `hooks/` buckets instead of per-page folders
- Business logic inside page/component files
- Supabase calls inside `model/` or JSX
- Screens importing `infrastructure/supabase` instead of domain `databridge/`
- Extra wrappers or service classes when a thin databridge function suffices
- Giant page components that own header + list + sidebar + modals inline
- “Export”, LMS jargon, or Google Classroom density on parent views
