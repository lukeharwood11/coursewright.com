# Infra

Terraform under `terraform/` (AWS SPA + Supabase provider). Prefer repo-root scripts:

| Script | Role |
|--------|------|
| [`../scripts/tf-plan.sh`](../scripts/tf-plan.sh) / [`tf-apply.sh`](../scripts/tf-apply.sh) | Tiered plan/apply |
| [`../scripts/build-spa.sh`](../scripts/build-spa.sh) | Vite build from Terraform outputs |
| [`../scripts/deploy-spa.sh`](../scripts/deploy-spa.sh) | Sync `dist/` + CloudFront invalidate |
| [`../scripts/deploy-supabase.sh`](../scripts/deploy-supabase.sh) | Migrations + Edge Functions |
| [`../scripts/deploy.sh`](../scripts/deploy.sh) | Local one-shot |

- Human blockers: [docs/HUMAN_NEEDED.md](../docs/HUMAN_NEEDED.md) — HN-003 (AWS/OIDC), HN-010 (Environments), HN-011 (Supabase Branching). ACM (HN-005) is done.
- Remote state keys: `testing/coursewright.com/terraform.tfstate`, `prod/coursewright.com/terraform.tfstate`
- Tier vars: [`tfvars/`](./tfvars/) — testing → `beta.coursewright.com`, production → `coursewright.com`
- Supabase: existing project `hlecttkgrfhtzvwnxtyb`; testing uses a **persistent DB branch**; production uses **main** (settings by ref)
- Auth: `SUPABASE_ACCESS_TOKEN` (local env + GitHub Actions secret)

## GitHub Actions

Dispatch-only: [`.github/workflows/terraform-plan.yml`](../.github/workflows/terraform-plan.yml) / [`terraform-apply.yml`](../.github/workflows/terraform-apply.yml). Workflows call the shared scripts (OIDC + `SUPABASE_ACCESS_TOKEN`).

| | Testing | Production |
|--|---------|------------|
| Domain | `beta.coursewright.com` | `coursewright.com` |
| Backend | `backend-testing.hcl` | `backend-production.hcl` |
| Gate | Environment `testing` | Environment `production` (reviewers — HN-010) |
