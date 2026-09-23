# Course Wright — Architecture

> **Status:** Proposed. Folder layout detail: [STRUCTURE.md](./STRUCTURE.md). Runtime choices: [STACK.md](./STACK.md). Product behavior: [FEATURES.md](./FEATURES.md).

We follow **Screaming Architecture**: the codebase should scream *Course Wright* — organizations, courses, roster, parents, materials, resources, print — not React, Supabase, or “MVC.” (`course-templates/` exists for **P1**.)

---

## Screaming Architecture

**Test:** Open `src/`. A stranger should guess this is a co-op / micro-school course product before they guess the framework.

| Screams (domain) | Whispers (details) |
|------------------|--------------------|
| `organizations/` | `infrastructure/supabase/` |
| `roster/` | `infrastructure/query/` |
| `course-templates/` | React, Tailwind, Vite |
| `courses/`, `units/`, `materials/` | Zustand stores, CSS files |
| `parent/`, `print/`, `sharing/` | Edge Function runtime |
| `auth/`, `marketing/` | S3 / CloudFront |

**Rules:**

1. **Domain folders are first-class** under `src/` — not buried under `features/`, `modules/`, or `containers/`.
2. **Frameworks are plugins** — UI and data adapters live at the edges (`infrastructure/`, `ui/`, `app/`). Domain code depends inward on product concepts; it does not sprawl “React patterns” as the organizing principle.
3. **Name folders after the product vocabulary** in [BRANDING.md](./BRANDING.md) / [FEATURES.md](./FEATURES.md): Organization, Course, Unit, Material, Roster, Print — not “resources,” “entities,” or “services.” (**Template** = **P1**.)
4. **One SPA, many screams** — admin, instructor, and parent are **roles** over the same domains, not separate applications that scream “three frontends.”
5. **Backend screams jobs** — `supabase/functions/create-course-from-course`, `send-organization-invite`, and `send-announcement-notification` scream a use case; `supabase/functions/api-v2` does not. (**P1:** `create-course-from-template`.)

If a new folder is named after a library (`redux/`, `hooks/`, `contexts/`) at the top of `src/`, it fails the scream test — push it under `infrastructure/` or into a domain.

---

## System shape

```text
┌─────────────────────────────────────────────────────────────┐
│  Browser SPA (coursewright.com / beta.…)               │
│  Domain modules scream product · UI is delivery               │
└───────────────┬─────────────────────────────┬───────────────┘
                │ PostgREST (CRUD)            │ Functions (complex)
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│  Supabase Postgres + RLS  │   │  Edge Functions             │
│  Auth · Storage           │   │  copy / sync / promote / …  │
└───────────────────────────┘   └─────────────────────────────┘
```

| Path | Use |
|------|-----|
| **Frontend → PostgREST** | Default create/read/update/delete when RLS can enforce rules |
| **Frontend → Edge Function** | Multi-step, privileged, or secret-bearing jobs (course-from-course copy, invite claim, cascades; **P1:** template copy/sync/promote) |
| **Auth** | Supabase Auth (email + Google) |
| **Files** | Supabase Storage; metadata in Postgres |
| **Host SPA** | S3 + CloudFront |

Details: [STACK.md](./STACK.md).

---

## Architectural layers (inside the SPA)

Think of three rings. **Dependencies point inward** toward the domain.

```text
┌────────────────────────────────────────┐
│  app/          routing, providers, shells │  ← delivery
├────────────────────────────────────────┤
│  ui/           STYLE_GUIDE primitives     │  ← delivery
├────────────────────────────────────────┤
│  organizations / roster / courses / …   │  ← SCREAMS (domain)
│  pages · components · api · model       │
├────────────────────────────────────────┤
│  infrastructure/   supabase, query, …   │  ← details
└────────────────────────────────────────┘
```

| Layer | Owns | Must not own |
|-------|------|--------------|
| **Domain (`src/<product>/`)** | Screens, domain components, PostgREST queries for that area, domain-local UI state, product rules expressed in the UI | Global “utils dump,” raw framework setup |
| **`app/`** | Router, auth gates, layout shells, provider wiring | Business rules for courses/roster |
| **`ui/`** | Buttons, badges, inputs per STYLE_GUIDE | Course-specific flows |
| **`infrastructure/`** | Supabase client, TanStack Query client, shared fetch helpers | Product feature UI |

**Zustand** = ephemeral UI state (modals, selection). **TanStack Query** = server/cache state. Never invert that ([STACK.md](./STACK.md)).

---

## Domain map (what should scream)

Aligned with P0 in [FEATURES.md](./FEATURES.md):

| Folder | Screams | Primary roles |
|--------|---------|----------------|
| `auth/` | Sign-in, sign-up, invite entry | Everyone |
| `marketing/` | Public home, about, pricing, footer placeholders | Unauthenticated |
| `organizations/` | Org create, settings, grade scheme, admin invites, **user profiles** | Admin |
| `roster/` | Student profiles, **classes**, enrollments, parent links/invites, **families / parent directory** | Admin, instructor |
| `courses/` | Offerings, dates, status, instructors, **grade levels**, create from course | Instructor, admin |
| `resources/` | **P1a** — org Resources: nested folders, document/link/file, ACL, bulk upload | Owner, admin, instructor; parent views when published + ACL |
| `course-templates/` | **P1** — blueprints, view/edit/owner access, **grade levels** | Instructor, admin |
| `units/` | Grouping + optional dates | Instructor |
| `materials/` | **Pages** (materials) + **blocks**, files, versions, important now | Instructor; parent views |
| `submissions/` | Turn-in on a material | Parent turns in; instructor reviews |
| `quizzes/` | Course quiz: take in the app or print | Instructor; parent takes or prints |
| `search/` | Advanced / cross-facet find (“where is this resource?”) | Admin, instructor (parent TBD) |
| `sharing/` | Resource links, share-with-parents | Instructor → parent |
| `print/` | Print material / unit / quiz / this week / org resource | Creator + parent |
| `parent/` | This week calendar + Focus + **announcements** | Parent role |
| `announcements/` | One-way notices (course / class / student) | Instructor, admin; parent views |
| `discussions/` | **P1** — two-way threads (one course or one class) | Instructor, admin; parent views |
| `notifications/` | **P1** — in-app Activity (stored notifications) | Instructor, admin; parent views |
| `lesson-plans/` | Weekly course plans with per-day materials | Instructor; parent views |
| `calendar/` | Month/week/day calendar of assigned, due, lesson plans, events | Instructor; parent |
| `events/` | Course, class, or organization events and their write-up | Instructor; parent |
| `billing/` | Org SaaS (P1) | Admin |

Cross-cutting usability (tech-averse parents, print in the open) is a **constraint on every domain**, not a separate `usability/` package.

---

## Data and use-case flow

### Simple (PostgREST)

```text
UI (courses/) → api query → supabase.from('…') → RLS → Postgres
                 ↑
           TanStack Query cache
```

### Complex (Function)

```text
UI (courses/)
  → api.invoke('create-course-from-course')   # P0
  → Edge Function (service role / transaction)
  → Postgres (+ Storage as needed)
  → client invalidates TanStack queries

UI (organizations/)
  → api.invoke('send-organization-invite')
  → Edge Function (Resend secret)
  → Resend event `organization-invite`

UI (announcements/)
  → api.invoke('send-announcement-notification')
  → Edge Function (Resend secret)
  → Resend event `announcement-notification` (one send per recipient)

UI (resources/)   # P1a
  → PostgREST insert/select (RLS)
  → org files / Storage for file items

UI (discussions/)   # P1
  → PostgREST insert/select (RLS)
  → supabase.channel postgres_changes (Realtime) while the thread, list, or org chrome is open
  → TanStack Query cache updates from those events

# P1: create-course-from-template, sync-template-resource, promote-to-template
```

**Decision test:** If RLS + a single table (or simple joins) can enforce it, stay on PostgREST. If the job is “copy a course (or template) tree with lineage,” use a Function.

---

## Access control

| Mechanism | Where |
|-----------|--------|
| **Authentication** | Supabase Auth — identity |
| **Authorization** | Postgres **RLS** (+ Storage policies) — org membership, roles, parent enrollment gates |
| **UI gates** | `app/` route guards — hide wrong chrome; **never** the only security layer |

Parent access rules (invite email, active course enrollment) live in schema/RLS per [database/SCHEMA.md](./database/SCHEMA.md). The `parent/` domain screams the dashboard; it does not re-implement policy in ad hoc checks alone.

---

## Backend architecture

| Piece | Screams | Notes |
|-------|---------|-------|
| `supabase/migrations/` | Tables and policies named for the domain | Runtime schema source of truth |
| `supabase/functions/<use-case>/` | Use case names | create-course-from-course, send-organization-invite, send-announcement-notification (**P0**); create-course-from-template, sync-template-resource, promote-to-template (**P1**); … |
| `database/SCHEMA.md` | Human-readable model | Planning under `docs/database/`; keep in sync with migrations |

Functions are **use-case adapters**, not a general REST API. Prefer few, obvious jobs over a growing “backend app.”

---

## Hosting architecture

```text
coursewright.com              → CloudFront → S3 (prod SPA)
beta.coursewright.com  → CloudFront → S3 (test SPA)
         │
         └── browser talks to Supabase (Auth / PostgREST / Storage / Functions)
```

SPA only on CloudFront. API is Supabase, not an origin on the CDN (except the static app).

**IaC:** **Terraform** under `infra/terraform/` — one stack, **`infra/tfvars/testing.tfvars` / `production.tfvars`** for tiers (separate state per tier). Supabase schema and Functions stay outside Terraform — see [STACK.md](./STACK.md) / [STRUCTURE.md](./STRUCTURE.md).

---

## Principles (short list)

1. **Scream the product** — domain names at the top of `src/`.
2. **Frameworks are details** — React/Supabase/Tailwind don’t organize the repo.
3. **PostgREST-first** — Functions for complexity only.
4. **RLS is the real gate** — UI gates are UX.
5. **One app, role chrome** — don’t split parent/instructor into separate codebases.
6. **Print and share are domains** — not afterthoughts under `utils/export`.
7. **Planning docs stay loud** — FEATURES / SCHEMA / STYLE_GUIDE live under `docs/` and are indexed from root [AGENTS.md](../AGENTS.md).
8. **`AGENTS.md` per folder** — each code directory has a short local guide; root [AGENTS.md](../AGENTS.md) is the index. Follow the nearest file when editing.

---

## Anti-patterns

| Anti-pattern | Why it fails the scream |
|--------------|-------------------------|
| `src/components/`, `src/hooks/`, `src/services/` as the primary tree | Screams “React app,” not Course Wright |
| `features/` wrapper that hides domain names one level down | Prefer domains at `src/<domain>/` |
| `api/` package that mirrors every table as a generic client | Screams ORM, not use cases |
| Mega `utils.ts` for business rules | Rules belong in the domain that owns them |
| Separate `parent-app` repo | Roles aren’t products |
| All writes through Functions | Screams “custom backend,” fights the stack |

---

## Doc map

| Doc | Owns |
|-----|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, Screaming Architecture, layers, flows |
| [STRUCTURE.md](./STRUCTURE.md) | Concrete folder tree |
| [AGENTS.md](../AGENTS.md) | Agent index; per-folder AGENTS.md guides |
| [STACK.md](./STACK.md) | Technologies |
| [database/SCHEMA.md](./database/SCHEMA.md) | Entities & access model |
| [FEATURES.md](./FEATURES.md) | Product behavior |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Visual delivery details |
| [VISION.md](./VISION.md) | Why the product exists |
| [BRANDING.md](./BRANDING.md) | Vocabulary & positioning |
