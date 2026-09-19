# AGENTS — `scripts/`

Repo-root utility scripts (not app runtime).

## Contents

| Script | Purpose |
|--------|---------|
| `nuke.sh` | Experiment-mode only: wipe linked/local Supabase DB and re-apply migrations. **Refuses parent/main** (`hlecttkgrfhtzvwnxtyb`); prefer the testing branch ref. |
| `tf-plan.sh <tier>` | `terraform init` + `plan -out=tf.plan` for `testing` \| `production` |
| `tf-apply.sh <tier>` | Apply saved `infra/terraform/tf.plan` for that tier |
| `build-spa.sh <tier>` | Write gitignored `.env.production` from Terraform outputs (incl. `VITE_PUBLIC_HOST` from `site_domain`; testing refuses parent/main) + `npm run build` |
| `deploy-spa.sh <tier>` | `aws s3 sync dist/` + CloudFront invalidate |
| `deploy-supabase.sh <tier>` | `db push` + Edge Functions to tier’s Supabase ref (testing = branch, production = main) |
| `deploy.sh <tier>` | Local one-shot: plan → apply → supabase → build → SPA (production requires `--yes`) |
| `gha-resolve-plan-run.sh` | Actions helper: matching plan artifact run id + git SHA |
| `lib/terraform-env.sh` | Shared helpers (sourced by the scripts above) |

## Rules

- Prefer scripts here over one-offs under `supabase/` or `infra/`.
- Destructive scripts must require confirmation (or an explicit `--yes`).
- Tiers must keep backend key + tfvars paired (`backend-testing.hcl` + `testing.tfvars`, etc.).
- `SUPABASE_ACCESS_TOKEN` required for Terraform Supabase provider and CLI scripts.
- Document new scripts in this file and link from root [AGENTS.md](../AGENTS.md) when agents should use them.
- GitHub Actions call these scripts — keep YAML thin.
