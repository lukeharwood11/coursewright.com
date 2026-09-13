# Course Wright — Project Structure

> **Status:** Proposed. Architecture & Screaming rules: [ARCHITECTURE.md](./ARCHITECTURE.md). Stack: [STACK.md](./STACK.md). Schema planning: [database/SCHEMA.md](./database/SCHEMA.md).

One **React SPA** + one **`supabase/`** backend folder. Folder names follow **Screaming Architecture**: `src/` leads with product domains, not frameworks.

---

## Why this shape

| Constraint | Implication |
|------------|-------------|
| **Screaming Architecture** | Domains at `src/<domain>/` — see [ARCHITECTURE.md](./ARCHITECTURE.md) |
| PostgREST-first CRUD | Each domain owns its `api/` (queries/mutations), not a central generic API app |
| Functions only for complex ops | `supabase/functions/<use-case>/` |
| `supabase db migrate` | `supabase/migrations/` = runtime schema |
| S3 + CloudFront SPA | Single `dist/` → S3; AWS via **Terraform** |
| Docs in `docs/` | Planning markdown under [`docs/`](./) — indexed from root [AGENTS.md](../AGENTS.md) |
| **`AGENTS.md` everywhere** | Each code folder has local agent rules; root [AGENTS.md](../AGENTS.md) indexes them |
| One SPA, three roles | Domains shared; `app/` swaps chrome by role |

---

## Top level

```text
coursewright.com/
├── AGENTS.md                 # agent index
├── README.md
├── THIRD_PARTY_NOTICES.md    # redistributed OSS license notices (e.g. Heroicons)
├── docs/                     # all product / planning docs
│   ├── AGENTS.md
│   ├── VISION.md
│   ├── FEATURES.md
│   ├── BRANDING.md
│   ├── STYLE_GUIDE.md
│   ├── STACK.md
│   ├── ARCHITECTURE.md
│   ├── STRUCTURE.md          # this file
│   ├── URLS.md               # UI URL map
│   ├── pages/                # per-page outlines
│   ├── HUMAN_NEEDED.md
│   └── database/             # schema planning
│       ├── AGENTS.md
│       ├── README.md
│       └── SCHEMA.md
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── .env.development          # Shared public Vite client env (testing)
├── .env.example              # Documents required VITE_* keys
├── public/
├── dist/                     # gitignored — build → S3
│
├── src/                      # SPA — domains scream here
├── supabase/                 # migrations + Edge Functions
├── infra/                    # Terraform (AWS) + deploy notes
│   └── terraform/
└── .github/                  # GitHub Actions (CI/CD)
    └── workflows/            # terraform-plan.yml + terraform-apply.yml (dispatch only)
```

---

## `src/` — scream the product

Domain folders sit at the **top** of `src/`. Framework wiring sits in `app/`, `ui/`, and `infrastructure/`.

```text
src/
├── main.tsx
│
├── organizations/            # org create, settings, grade scheme, admin invites
├── roster/                   # student profiles, enrollments, parent invites/links, families
├── course-templates/         # P1 — blueprints + view/edit/owner
├── courses/                  # offerings, create-from-course, instructors, dates, grade levels, status
├── units/                    # structure, order, optional dates
├── materials/                # content, files (incl. audio/video), versions, important now
├── search/                   # P0 advanced / cross-facet search (when implemented)
├── sharing/                  # resource links, share with parents
├── print/                    # print material / unit / this week
├── parent/                   # this week + important now dashboard
├── auth/                     # login, signup, invite entry, session helpers
├── marketing/                # public home, about, pricing, privacy
├── billing/                  # P1 stub — Stripe later
│
├── app/                      # delivery: router, providers, shells, gates
│   ├── App.tsx
│   ├── router.tsx
│   ├── providers.tsx
│   └── layouts/              # collapsible org sidebar + role chrome
│
├── ui/                       # STYLE_GUIDE primitives (button, badge, input)
│
├── infrastructure/           # details — keep quiet
│   ├── supabase/
│   │   ├── client.ts
│   │   └── storage.ts
│   ├── posthog/              # PostHog client (HN-006)
│   ├── query-client.ts       # TanStack Query
│   └── utils.ts
│
└── styles/
    └── index.css             # Tailwind + STYLE_GUIDE CSS variables
```

Generated DB types can live at `src/infrastructure/supabase/database.types.ts` (or `src/types/database.ts` if you prefer) — they are infrastructure, not a domain.

### Domain folder convention

```text
courses/
├── index.ts                  # public exports for this domain
├── pages/                    # route-level screens
├── components/               # domain UI only
├── api/                      # PostgREST + Function invokes (TanStack Query)
├── model/                    # optional: pure helpers / constants for this domain
└── stores/                   # optional: Zustand UI state for this domain only
```

**Rule:** `api/` is the only place that talks to Supabase for that domain. Screens import from `api/`, not from `infrastructure/supabase` ad hoc.

### Role surfaces (same app)

| Surface | Domains | Layout (`app/layouts`) |
|---------|---------|-------------------------|
| Marketing | `marketing` | Public header / footer |
| Login / signup / invite | `auth` | Minimal |
| Parent | `parent`, `materials`, `print`, `sharing` | Phone-first tabs |
| Instructor | `courses`, `units`, `materials`, `roster`, `print`, `sharing` (**P1:** `course-templates`) | Desktop course chrome |
| Admin | `organizations`, `roster`, + instructor domains as needed | Org nav |

---

## `supabase/` — backend

```text
supabase/
├── config.toml
├── seed.sql
├── migrations/               # runtime schema + RLS + storage policies
│   └── YYYYMMDDHHMMSS_*.sql
├── functions/                # use-case names (scream jobs)
│   ├── _shared/
│   ├── create-course-from-course/   # P0
│   ├── create-course-from-template/ # P1
│   ├── sync-template-resource/      # P1
│   ├── promote-to-template/         # P1
│   ├── claim-invite/
│   ├── revert-material/
│   └── stripe-webhook/       # P1
└── .gitignore
```

| Path | Role |
|------|------|
| `docs/database/SCHEMA.md` | Planning model |
| `supabase/migrations/` | What runs |

---

## `infra/` — AWS via Terraform

```text
infra/
├── README.md
├── tfvars/                   # tier values (sibling to terraform/)
│   ├── testing.tfvars        # justtesting.coursewright.com
│   └── production.tfvars     # coursewright.com
└── terraform/                # one root module; tiers via ../tfvars
    ├── AGENTS.md
    ├── modules/
    │   └── spa_site/         # S3 + CloudFront + ACM/DNS
    └── …                     # main.tf, variables.tf, backend; state per tier <!-- TBD -->
```

| Tier | Domain | Var file |
|------|--------|----------|
| Testing | `justtesting.coursewright.com` | `infra/tfvars/testing.tfvars` |
| Production | `coursewright.com` | `infra/tfvars/production.tfvars` |

```bash
cd infra/terraform
terraform apply -var-file=../tfvars/testing.tfvars
terraform apply -var-file=../tfvars/production.tfvars
```

**Terraform manages:** S3 buckets, CloudFront distributions, TLS certs (ACM), DNS records as needed for those hosts.

**Not Terraform:** Supabase projects/schema (`supabase db migrate`), Edge Functions, or app secrets in Supabase — those stay on the Supabase CLI / dashboard workflow.

Same stack definition for every tier — **do not** fork separate `envs/testing` vs `envs/production` roots; use tfvars + separate state per tier.

---

## What goes where

| Change | Put it here |
|--------|-------------|
| New product capability | New or existing **`src/<domain>/`** |
| New table / RLS | `supabase/migrations/` |
| Simple CRUD UI | `src/<domain>/api` + `pages` |
| Create course from course (P0) | `supabase/functions/create-course-from-course/` |
| Template copy / sync / promote (**P1**) | `supabase/functions/<use-case>/` |
| Print | `src/print/` |
| Public marketing pages | `src/marketing/` |
| Button look | `src/ui/` + `styles/` |
| Modal / selection state | Domain `stores/` or small `app` store — Zustand |
| Server list/cache | TanStack Query in domain `api/` |
| Supabase client setup | `src/infrastructure/supabase/` |
| Deploy SPA | GHA `terraform-apply.yml`: `aws s3 sync dist/` + CloudFront invalidate; AWS resources via **Terraform** |

---

## Explicitly not this structure

- Top-level `components/`, `hooks/`, `services/`, `store/` as the primary tree (fails scream test)
- Mute wrapper like `src/features/` that hides domain names
- `apps/web` + `apps/api` monorepo
- Separate parent / instructor apps
- Server state in Zustand
- Business rules dumped in `infrastructure/utils.ts`

---

## Scaffold order

1. Vite + React + Tailwind + TS  
2. `supabase init` + baseline migrations (org, membership, RLS)  
3. `infrastructure/supabase` + `auth/` + login route  
4. `organizations/` → `courses/` → `units/` → `materials/` via PostgREST  
5. Function for **create-course-from-course** (P0); template copy/sync/promote later (**P1**)  
6. `parent/` + `print/`  
7. Terraform for testing + production SPA hosting; deploy domains  

---

## Doc map

| Doc | Owns |
|-----|------|
| [AGENTS.md](../AGENTS.md) | Agent index; per-folder writing guides |
| [AGENTS.md](./AGENTS.md) | Rules for this docs folder |
| [HUMAN_NEEDED.md](./HUMAN_NEEDED.md) | Human/admin blockers & steps |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Screaming Architecture, layers, flows |
| [STRUCTURE.md](./STRUCTURE.md) | Concrete folder tree |
| [URLS.md](./URLS.md) | UI URL map |
| [pages/](./pages/) | Per-page outlines |
| [STACK.md](./STACK.md) | Technologies |
| [database/SCHEMA.md](./database/SCHEMA.md) | Entity model (planning) |
| [FEATURES.md](./FEATURES.md) | Product behavior |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Visual system |
