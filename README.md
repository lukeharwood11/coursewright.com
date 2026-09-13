# Course Wright

LMS for **homeschool co-ops and micro-schools** — plan courses, reuse templates, share materials with parents, and print what you need without heavy school software.

**Plan wright. Share wright. Course Wright.**  
**Short:** Courses, done wright.

| | |
|--|--|
| Production | [coursewright.com](https://coursewright.com) |
| Testing | [justtesting.coursewright.com](https://justtesting.coursewright.com) |

---

## Status

Early scaffolding. Product behavior is documented under [`docs/`](./docs/); the SPA has a live auth shell plus domain placeholders. Remaining cloud setup (AWS, Terraform state, DNS) is tracked in [docs/HUMAN_NEEDED.md](./docs/HUMAN_NEEDED.md).

---

## Stack

- **Frontend:** React, Vite, Tailwind CSS, Heroicons, TanStack Query, Zustand  
- **Backend:** Supabase (Postgres + PostgREST + Auth + Storage + Edge Functions)  
- **Hosting:** AWS S3 + CloudFront (Terraform; `infra/tfvars/testing.tfvars` / `production.tfvars`)  
- **Project docs:** VitePress (markdown → searchable site)  
- **UI docs:** Storybook  
- **CI/CD:** GitHub Actions  

Full detail: [docs/STACK.md](./docs/STACK.md).

---

## Quick start (local)

```bash
npm install
npm run dev
```

Shared testing keys are in committed `.env.development` (loaded automatically by Vite in dev). Override with a gitignored `.env.local` if needed. Production builds get `VITE_*` from CI/hosting.

| Script | What it does |
|--------|----------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Preview the production build |

Without Supabase env vars, the app still loads; auth shows a setup notice.

---

## Documentation

Everything product-related lives in **`docs/`**. Agent index: [AGENTS.md](./AGENTS.md).

| Doc | Purpose |
|-----|---------|
| [docs/VISION.md](./docs/VISION.md) | Product vision |
| [docs/FEATURES.md](./docs/FEATURES.md) | P0 / P1 / P2 features |
| [docs/BRANDING.md](./docs/BRANDING.md) | Name, voice, vocabulary |
| [docs/STYLE_GUIDE.md](./docs/STYLE_GUIDE.md) | Visual system |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Screaming Architecture |
| [docs/STRUCTURE.md](./docs/STRUCTURE.md) | Folder layout |
| [docs/STACK.md](./docs/STACK.md) | Technologies |
| [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) | Third-party license notices |
| [docs/database/SCHEMA.md](./docs/database/SCHEMA.md) | Data model (planning) |
| [docs/HUMAN_NEEDED.md](./docs/HUMAN_NEEDED.md) | Human/admin cloud todos |

| Code path | Purpose |
|-----------|---------|
| `src/` | React SPA (domain folders scream the product) |
| `supabase/` | Migrations + Edge Functions |
| `infra/terraform/` | AWS SPA hosting |

---

## Architecture (short)

- **Screaming Architecture** — `src/` is organized by product domains (`courses/`, `roster/`, `print/`, …), not by frameworks.  
- **PostgREST-first** — simple CRUD from the browser; Edge Functions only for complex jobs.  
- **One SPA** — admin, instructor, and parent share the app; chrome differs by role.

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) and [docs/STRUCTURE.md](./docs/STRUCTURE.md).

---

## Deploy notes

1. Complete open items in [docs/HUMAN_NEEDED.md](./docs/HUMAN_NEEDED.md) (AWS, Terraform state, DNS; production Supabase when needed).  
2. Build: `npm run build` → upload `dist/` to the tier’s S3 bucket.  
3. Terraform tiers:
   ```bash
   cd infra/terraform
   terraform plan  -var-file=../tfvars/testing.tfvars
   terraform apply -var-file=../tfvars/production.tfvars
   ```
   Keep **separate state** per tier.

Schema changes: `supabase db migrate` (after linking a project).

---

## License

Copyright © 2026 Luke Harwood. All Rights Reserved.

This software and its source code are proprietary. No part of this project may be copied, modified, distributed, or used without prior written permission from the copyright holder.
