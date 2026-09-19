# Course Wright — AGENTS index

This file is the **entry point for agents** working in this repo. Prefer the nearest folder `AGENTS.md` when editing code; use this index to find the right one.

## Documentation (`docs/`)

All product and planning docs live under [`docs/`](./docs/). Start here before inventing behavior.

| Doc | Use when |
|-----|----------|
| [docs/VISION.md](./docs/VISION.md) | Why the product exists |
| [docs/FEATURES.md](./docs/FEATURES.md) | What to build (P0/P1/P2) — **source of truth for behavior** + **Status** progress |
| [docs/BRANDING.md](./docs/BRANDING.md) | Vocabulary (Organization, Template, Course, …) |
| [docs/STYLE_GUIDE.md](./docs/STYLE_GUIDE.md) | Colors, type, components, parent UX |
| [docs/STACK.md](./docs/STACK.md) | Supabase, React, Terraform, hosting |
| [docs/FILE_STORAGE.md](./docs/FILE_STORAGE.md) | File storage, audio/video playback & streaming design |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Screaming Architecture, layers, flows |
| [docs/STRUCTURE.md](./docs/STRUCTURE.md) | Folder tree |
| [docs/URLS.md](./docs/URLS.md) | UI URL map — routes by feature/page |
| [docs/pages/](./docs/pages/) | Per-page outlines (what’s on each screen) |
| [docs/database/SCHEMA.md](./docs/database/SCHEMA.md) | Entities & access rules (planning) |
| [docs/database/README.md](./docs/database/README.md) | Schema folder purpose |
| [docs/HUMAN_NEEDED.md](./docs/HUMAN_NEEDED.md) | **Human/admin todos** (AWS, Supabase, Google, DNS) — agents must update when blocked |
| [docs/AGENTS.md](./docs/AGENTS.md) | Rules for editing docs |

Also: [README.md](./README.md) — human quick start.

## Experiment mode

**We are currently in experiment mode.** Until this section is removed or updated:

- Supabase migrations under `supabase/migrations/` may be **completely dropped and re-added** (squash / rewrite history) rather than appending irreversible forward-only changes.
- Prefer a clean, coherent migration set over preserving every intermediate migration when the schema is still in flux.
- Do **not** assume production data or remote migration history must be preserved unless a human says otherwise.
- To wipe the linked (or local) database and re-apply whatever migrations remain: [`scripts/nuke.sh`](./scripts/nuke.sh).

When experiment mode ends, treat migrations as append-only again, remove or retire `nuke.sh`, and update this section.

## Global rules (every folder)

1. **Screaming Architecture** — organize by product domain, not by framework. See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).
2. **Do not invent product behavior** — if it’s not in FEATURES / SCHEMA / decisions, ask or leave TBD.
3. **Feature status** — when you **start** or **finish** work on a feature, update its **Status** (and Notes if useful) in [docs/FEATURES.md](./docs/FEATURES.md). Start → `in progress`; finish scoped work → `shipped` (or `deferred` if parked). Status key lives at the top of that file.
4. **PostgREST-first** — simple CRUD from the frontend; Edge Functions only for complex/privileged jobs ([docs/STACK.md](./docs/STACK.md)).
5. **Usability bar** — tech-averse parents; print/share stay obvious ([docs/FEATURES.md](./docs/FEATURES.md)).
6. **`AGENTS.md` in every code folder** — when you create a new folder that will hold code, add a short local `AGENTS.md`. Prefer the nearest guide while editing.
7. **Human blockers** — if you need AWS / Supabase / Google / DNS admin access, add a placeholder in code and a detailed item in [docs/HUMAN_NEEDED.md](./docs/HUMAN_NEEDED.md). Do not invent secrets or fake completed cloud setup.
8. **Docs live in `docs/`** — don’t recreate planning markdown at the repo root (except this file and README).

## Folder agent guides

### App (`src/`)

| Path | Guide |
|------|--------|
| [src/AGENTS.md](./src/AGENTS.md) | SPA overview |
| [src/organizations/AGENTS.md](./src/organizations/AGENTS.md) | Orgs, grade scheme, admin invites |
| [src/roster/AGENTS.md](./src/roster/AGENTS.md) | Students, enrollments, parent links |
| [src/course-templates/AGENTS.md](./src/course-templates/AGENTS.md) | Templates + access |
| [src/courses/AGENTS.md](./src/courses/AGENTS.md) | Course instances |
| [src/units/AGENTS.md](./src/units/AGENTS.md) | Units |
| [src/materials/AGENTS.md](./src/materials/AGENTS.md) | Materials, files, versions, important now |
| [src/sharing/AGENTS.md](./src/sharing/AGENTS.md) | Resource links / share with parents |
| [src/search/AGENTS.md](./src/search/AGENTS.md) | Cross-facet / chrome search |
| [src/print/AGENTS.md](./src/print/AGENTS.md) | Print material / unit / this week |
| [src/parent/AGENTS.md](./src/parent/AGENTS.md) | Parent dashboard |
| [src/auth/AGENTS.md](./src/auth/AGENTS.md) | Login, signup, invites, session |
| [src/marketing/AGENTS.md](./src/marketing/AGENTS.md) | Public home, about, pricing, contact, privacy, cookies |
| [src/billing/AGENTS.md](./src/billing/AGENTS.md) | P1 Stripe stub only |
| [src/app/AGENTS.md](./src/app/AGENTS.md) | Router, layouts, gates |
| [src/app/layouts/AGENTS.md](./src/app/layouts/AGENTS.md) | Collapsible org sidebar chrome |
| [src/ui/AGENTS.md](./src/ui/AGENTS.md) | Design-system primitives |
| [src/infrastructure/AGENTS.md](./src/infrastructure/AGENTS.md) | Clients & wiring |
| [src/infrastructure/supabase/AGENTS.md](./src/infrastructure/supabase/AGENTS.md) | Supabase browser client |
| [src/styles/AGENTS.md](./src/styles/AGENTS.md) | Global CSS / tokens |

### Backend & infra

| Path | Guide |
|------|--------|
| [docs/database/AGENTS.md](./docs/database/AGENTS.md) | Schema **planning** docs only |
| [supabase/AGENTS.md](./supabase/AGENTS.md) | Supabase project overview |
| [supabase/migrations/AGENTS.md](./supabase/migrations/AGENTS.md) | SQL migrations + RLS |
| [supabase/functions/AGENTS.md](./supabase/functions/AGENTS.md) | Edge Functions (use cases) |
| [infra/AGENTS.md](./infra/AGENTS.md) | AWS hosting overview |
| [infra/terraform/AGENTS.md](./infra/terraform/AGENTS.md) | Terraform for S3/CloudFront |
| [infra/tfvars/AGENTS.md](./infra/tfvars/AGENTS.md) | Tier var files (testing / production) |
| [.github/AGENTS.md](./.github/AGENTS.md) | GitHub Actions (dispatch-only Terraform plan/apply) |
| [scripts/AGENTS.md](./scripts/AGENTS.md) | Root utility scripts (e.g. experiment-mode `nuke.sh`) |

## Environments

| Env | URL | Terraform |
|-----|-----|-----------|
| Production | `coursewright.com` | `-var-file=../tfvars/production.tfvars` |
| Testing | `beta.coursewright.com` | `-var-file=../tfvars/testing.tfvars` |
