# Course Wright — Stack

> **Status:** Decided for implementation. Product behavior lives in [FEATURES.md](./FEATURES.md); data model in [database/SCHEMA.md](./database/SCHEMA.md).

---

## Decided

| Layer | Choice | Role |
|-------|--------|------|
| **Database** | **Supabase** (Postgres) | Source of truth; org-scoped multi-tenancy |
| **CRUD API** | **Supabase PostgREST** from the **frontend** | Default path for reads/writes — as much as possible |
| **Complex backend** | **Supabase Functions** (Edge Functions) | Operations that must not live in the client |
| **Auth** | **Supabase Auth** | Sessions / users; **email** (password or magic link) + **Sign in with Google** |
| **Google sign-in** | **Google Cloud** (OAuth client) wired into Supabase Auth | Provider for Google login |
| **File storage** | **Supabase Storage** | Lesson files / material attachments (P0 file sharing) |
| **Frontend hosting** | **AWS S3** + **CloudFront** | Static React app CDN |
| **IaC** | **Terraform** | AWS SPA hosting; **`infra/tfvars/testing.tfvars` / `production.tfvars`** for tiers |
| **Custom domain** | **coursewright.com** | Production app (owned) |
| **Testing domain** | **beta.coursewright.com** | Non-production / testing site |
| **Migrations** | **`supabase db migrate`** | Schema changes via Supabase CLI migrations |
| **UI** | **React** + **Tailwind CSS** | Product UI |
| **Icons** | **Heroicons** (`@heroicons/react`) | UI icons (MIT); notices in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) |
| **Page editor** | **Lexical** (`lexical`, `@lexical/react`) | WYSIWYG for page materials ([lexical.dev](https://lexical.dev/)); MIT notice in THIRD_PARTY_NOTICES.md |
| **Print PDF** | **`@react-pdf/renderer`** + **pdf-lib** + **qrcode** | React document tree → blob; pdf-lib merges original PDF files; iframe preview |
| **Bundler** | **Vite** | SPA build → `dist/` → S3 |
| **Server/async state** | **TanStack Query** | Data fetching / cache against PostgREST |
| **Client state** | **Zustand** | UI and local app state |
| **Project docs site** | **VitePress** | Browseable site generated from markdown (`docs/`, `AGENTS.md`, …) |
| **UI component docs** | **Storybook** | Develop / document `src/ui` (and related) components in isolation |
| **CI/CD** | **GitHub Actions** | Lint/typecheck/build; deploy SPA and related pipelines |
| **Product analytics** | **PostHog** | Product usage / funnels; client exception capture in the SPA |
| **Transactional email** | **Resend** | Organization invite emails (`organization-invite`) via `send-organization-invite`. Announcement opt-in emails (`announcement-notification`) via `send-announcement-notification`. API key is a Supabase Function secret (**HN-015**) |
| **Realtime (P1 discussions)** | **Supabase Realtime** | Postgres changes on discussion tables while the SPA is open. RLS still applies. Not email, not push, not typing indicators in this slice |
| **Billing (P1)** | **Stripe Billing** *(hypothesis)* | Course Wright charges orgs — not P0 |

---

## Architecture rules

1. **PostgREST-first** — Prefer the Supabase client + RLS for create/read/update/delete. Do not put simple CRUD behind a Function by default.
2. **Functions for complexity** — Use Supabase Functions when the work needs secrets, multi-step transactions, privileged logic, or rules that should not be enforceable by RLS alone (e.g. **course → course copy**, **invite email (Resend)**, invite claim flows, versioning/revert edge cases; **P1:** template → course copy/sync, promote).
3. **RLS is the access gate** — Frontend CRUD assumes Row Level Security encodes org/role rules (admin, instructor, parent). Schema and policies must match [FEATURES.md](./FEATURES.md) / [database/SCHEMA.md](./database/SCHEMA.md). Storage policies follow the same org/role intent for file access.
4. **Auth** — Supabase Auth owns identity. Login screen: **email + password**, **email magic link**, and **Sign in with Google** (Google Cloud OAuth → Supabase). Signup is Google or **email + password** and signs the person in on success. Invite claim uses the same email identity rules as product docs.
5. **Files** — Uploads go to **Supabase Storage**; `File` rows in Postgres hold metadata / `storage_ref`. Prefer Storage + RLS (or signed URLs via Function when needed) over a separate file host. Playback / versioning / escalation design: [FILE_STORAGE.md](./FILE_STORAGE.md).
6. **TanStack owns server state** — Queries/mutations against PostgREST (and Function calls). **Zustand** owns ephemeral UI state (modals, draft editors, selection) — not a second source of truth for remote data.
7. **Frontend deploy** — Build the React app → **S3**; serve via **CloudFront**. **Production:** `coursewright.com`. **Testing:** `beta.coursewright.com`. No separate app server for the UI. **AWS resources are managed with Terraform** (`infra/terraform/`).
8. **Schema changes** — Apply with **`supabase db migrate`** (Supabase CLI). Keep migration history in repo; don't hand-edit production schema.
9. **One frontend** — React + Tailwind for admin, instructor, and parent surfaces. Responsive web; no native app.
10. **Billing (P1 only)** — **Stripe Billing** is the planned path when org SaaS ships; webhooks → Functions → `OrgSubscription`. Not in P0.
11. **Markdown → docs site** — Hand-written markdown (`docs/`, root + folder `AGENTS.md`, README) is the source; **VitePress** builds a searchable site so developers can explore the project without hunting through the tree.
12. **UI docs** — **Storybook** for design-system / component exploration (`src/ui`). Not a replacement for product docs in VitePress.
13. **CI/CD** — **GitHub Actions** owns check and deploy pipelines (`.github/workflows/`). Terraform plan/apply are **dispatch-only** and call shared `scripts/`. SPA publish is `deploy-spa.sh` (S3 sync + CloudFront invalidate). Confirm HN-003 / HN-010 / HN-011 before live apply (ACM HN-005 is done). See [HUMAN_NEEDED.md](./HUMAN_NEEDED.md).
14. **Analytics** — **PostHog** for product analytics (page views, key actions, funnels) and **error tracking** (exception autocapture + catch-all boundary reports). Wire the browser SDK from the SPA; do not invent a second analytics stack. Project keys come from human setup ([HUMAN_NEEDED.md](./HUMAN_NEEDED.md)). Respect auth/privacy: identify only after login when needed; no PII beyond what product docs allow.
15. **Search is a first-class data concern** — Schema, indexes, and material metadata must support **cross-facet search** (P0 in [FEATURES.md](./FEATURES.md)). Prefer Postgres full-text / structured filters via PostgREST when they meet the bar; introduce a dedicated search service only if FTS + facets cannot. Do not treat search as a late UI filter over unindexed lists.
16. **Realtime is opt-in per product surface** — **P1 discussions** subscribe to Postgres changes through the existing Supabase browser client while the SPA is open. RLS still gates payloads. Do not add a second websocket stack. Email / push stay on the P1 Notifications row.

---

## Split: PostgREST vs Functions

| Prefer PostgREST (frontend) | Prefer Supabase Functions |
|-----------------------------|---------------------------|
| Load org, courses, units, materials | **Create course from course** (copy units/materials — **P0**) |
| Edit a material title / dates / text | **Send organization invite email** (`send-organization-invite` → Resend); **send announcement notification** (`send-announcement-notification` → Resend) |
| Roster list / enroll when rules fit RLS | Invite claim / privileged membership writes |
| Parent dashboard reads for this week | Soft-delete cascades / revert that touch many rows |
| Discussion CRUD + Realtime subscribe (P1) | Anything needing service-role or **external email** |
| ShareLink create/read when RLS allows | **P1:** Create course from template (copy + lineage) |
| Auth session via Supabase client | **P1:** Template → course sync for unmodified copies |
| Storage upload/download when policies allow | **P1:** Promote instance content → template; signed URL / privileged file ops if RLS alone is insufficient |

Exact Function list is implementation detail; the rule is **simple = PostgREST, complex = Function**.

---

## Auth detail

| Method | How |
|--------|-----|
| **Email** | Supabase Auth email sign-up (password) / sign-in (password or magic link) |
| **Google** | Google Cloud OAuth client → Supabase Auth Google provider |

Product rule unchanged: parents use the **same email** as their invite (see [FEATURES.md](./FEATURES.md)).

---

## Hosting detail

| Piece | Role |
|-------|------|
| **S3** | Static assets (built React SPA) |
| **CloudFront** | CDN / HTTPS in front of the bucket |
| **Production** | **coursewright.com** (owned) |
| **Testing** | **beta.coursewright.com** |
| **IaC** | **Terraform** — define/apply AWS hosting (and related DNS/ACM) |

API traffic goes to **Supabase** (PostgREST, Auth, Storage, Functions) — not through an app origin on CloudFront except for the SPA itself.

Terraform owns **AWS** (SPA hosting/DNS) and **Supabase project/branch/settings** via the official provider (`infra/terraform/supabase.tf`). SQL migrations and Edge Function source deploys stay on the Supabase CLI ([`scripts/deploy-supabase.sh`](../scripts/deploy-supabase.sh)).

**Tiers:** prefer `./scripts/tf-plan.sh testing|production` from repo root (pairs backend key + tfvars). Keep **separate state** per tier (`testing/coursewright.com/…`, `prod/coursewright.com/…`). Testing uses a **persistent Supabase DB branch**; production uses project **main** by ref (HN-011).

---

## Migrations

| Tool | Use |
|------|-----|
| **`supabase db migrate`** | Apply versioned SQL migrations against the Supabase project |

Schema design stays in [database/SCHEMA.md](./database/SCHEMA.md) until implemented as migration files.

---

## Billing (P1 — not P0)

| Piece | Role |
|-------|------|
| **Stripe Billing** | Subscriptions for orgs (Course Wright → org) |
| **Supabase Functions** | Webhooks; sync subscription state onto `OrgSubscription` |

Packaging (per teacher vs per course) still open — see [FEATURES.md](./FEATURES.md).

---

## Project documentation site (VitePress)

| Piece | Role |
|-------|------|
| **Markdown sources** | `docs/**/*.md`, root [AGENTS.md](../AGENTS.md), folder `AGENTS.md` files, [README.md](../README.md) |
| **VitePress** | Builds a static, searchable docs site from those files for developer exploration |

Product/planning content stays curated markdown; VitePress only publishes/navigates it. Parent-facing in-app help is out of scope here.

<!-- TBD: VitePress root config, sidebar map from AGENTS index, local `npm run docs:dev`, and whether CI publishes the docs site (and where) -->

---

## UI component docs (Storybook)

| Piece | Role |
|-------|------|
| **Storybook** | Isolated stories for `src/ui` primitives (and other presentational pieces as needed) |
| **STYLE_GUIDE** | Visual rules Storybook should reflect — [STYLE_GUIDE.md](./STYLE_GUIDE.md) |

<!-- TBD: Storybook Vite builder setup, story location convention, CI build of Storybook -->

---

## CI/CD (GitHub Actions)

| Piece | Role |
|-------|------|
| **GitHub Actions** | Workflows under `.github/workflows/` |
| **PR / main checks** | Install, typecheck, build (and tests when they exist) |
| **Terraform plan** | `workflow_dispatch` only — [terraform-plan.yml](../.github/workflows/terraform-plan.yml). OIDC + `SUPABASE_ACCESS_TOKEN` → compile-check build → `./scripts/tf-plan.sh` → `tf.plan` artifact |
| **Terraform apply** | `workflow_dispatch` only — [terraform-apply.yml](../.github/workflows/terraform-apply.yml). Checkout plan SHA → `./scripts/tf-apply.sh` → optional `./scripts/deploy-supabase.sh` → `./scripts/build-spa.sh` → `./scripts/deploy-spa.sh` (no Terraform `null_resource`) |

Input `tier`: `testing` \| `production`. Production jobs use GitHub Environment `production` (required reviewers — HN-010). OIDC role `arn:aws:iam::891612573605:role/github-oidc`, Terraform **1.16.3**, region `us-east-1`.

Confirm HN-003 (AWS/OIDC) and HN-010 (Environments) before live apply. ACM (HN-005) is ISSUED. Supabase Branching: HN-011.

Deploy credentials stay in GitHub Actions OIDC / secrets / environments — not in the repo. Human setup: [HUMAN_NEEDED.md](./HUMAN_NEEDED.md).

<!-- TBD: PR/main check workflow, required status checks -->

---

## Product analytics (PostHog)

| Piece | Role |
|-------|------|
| **PostHog** | Product analytics — usage, funnels, feature adoption; client exception capture |
| **SPA client** | PostHog JS SDK (env: project key + host); `capture_exceptions` + boundary `captureException` |
| **Human setup** | Create PostHog project(s); keys in env / CI — [HUMAN_NEEDED.md](./HUMAN_NEEDED.md) |

<!-- TBD: event taxonomy, whether session replay is on, separate projects for testing vs production -->

---

## Search (P0 — product requirement)

| Piece | Role |
|-------|------|
| **In-product search** | Find materials, files, courses, units, people — “where do I have this resource?” |
| **Default path (hypothesis)** | Postgres full-text + structured facet filters via PostgREST / RLS |
| **Escalation** | Dedicated search index only if facets / ranking / latency demand it |

Product behavior: [FEATURES.md](./FEATURES.md). Schema must index searchable fields early — [database/SCHEMA.md](./database/SCHEMA.md).

---

## Still open

| Concern | Status |
|---------|--------|
| www vs apex / DNS cutover details | <!-- TBD --> |
| Separate Supabase project / env for testing | <!-- TBD --> |
| CloudFront SPA fallback / cache headers | <!-- TBD --> |
| SaaS packaging (per teacher vs per course) | Hypothesis only |
| VitePress config / sidebar / where docs site is hosted | <!-- TBD --> |
| Storybook layout / which components get stories first | <!-- TBD --> |
| PR/main checks; migrate/Functions deploy from CI | <!-- TBD --> |
| PostHog: event taxonomy / session replay / env split | <!-- TBD --> |
| Search: Postgres FTS vs dedicated index | Hypothesis — start Postgres-first |

---

## Out of scope for this stack

- Separate custom Node/Rails API as the primary CRUD layer
- Putting all writes through Functions when PostgREST + RLS would suffice
- Native iOS / Android apps
- Hosting the SPA on Supabase or Vercel as the primary path (AWS S3 + CloudFront is the choice)

---

## Doc map

| Doc | Owns |
|-----|------|
| [STACK.md](./STACK.md) | Runtime / framework choices |
| [FILE_STORAGE.md](./FILE_STORAGE.md) | Storage layout, signed playback, media escalation |
| [AGENTS.md](../AGENTS.md) | Agent index + global rules; folder `AGENTS.md` files litter the tree |
| [HUMAN_NEEDED.md](./HUMAN_NEEDED.md) | Human/admin account tasks (AWS, Supabase, Google, DNS) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, Screaming Architecture |
| [STRUCTURE.md](./STRUCTURE.md) | Repo / folder layout |
| [database/SCHEMA.md](./database/SCHEMA.md) | Entities, relationships, access model |
| [FEATURES.md](./FEATURES.md) | Product behavior and priorities |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Visual system |
| [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) | OSS license notices for redistributed deps |
| [VISION.md](./VISION.md) | Product vision |
| [BRANDING.md](./BRANDING.md) | Positioning and voice |
