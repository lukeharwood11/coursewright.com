# AGENTS — `infra/terraform/`

Terraform for Course Wright: **AWS SPA** + **Supabase** (provider). **One root module**, tiers via **`.tfvars`** in sibling `../tfvars/`. Prefer [`scripts/tf-plan.sh`](../../scripts/tf-plan.sh) / [`tf-apply.sh`](../../scripts/tf-apply.sh) over raw CLI.

## Scope

- `modules/spa_site` — S3 + CloudFront OAC + Route53
- `supabase.tf` — provider `supabase/supabase` (token: `SUPABASE_ACCESS_TOKEN`)
  - **testing:** persistent `supabase_branch` (`git_branch = "testing"`) + settings/apikeys on the branch
  - **production:** settings/apikeys on existing project `hlecttkgrfhtzvwnxtyb` (by ref — no `supabase_project` resource, no import)
- **`../tfvars/testing.tfvars`** → `beta.coursewright.com` (`coursewright-testing-spa`)
- **`../tfvars/production.tfvars`** → `coursewright.com` (`coursewright-production-spa`)

SPA sync/invalidation is **not** in this module — [`scripts/deploy-spa.sh`](../../scripts/deploy-spa.sh) / GHA (never a `null_resource`). SQL migrations stay CLI ([`scripts/deploy-supabase.sh`](../../scripts/deploy-supabase.sh)). SPA Vite keys come from Terraform outputs via [`scripts/build-spa.sh`](../../scripts/build-spa.sh) after apply.

**Gates:** ACM (HN-005) is ISSUED. Confirm HN-003 (AWS/OIDC) and HN-010 (Environments) before live apply. Supabase Branching must be available on the org/plan (HN-011). Pin Terraform **1.16.3** locally and in Actions (`.terraform-version` + workflow `TERRAFORM_VERSION`; plan files are not portable across versions).

## Remote state

Shared nosh/amia backend (`lukeharwood-dev-tfstate`, `us-east-2`, S3 `use_lockfile`). CourseWright keys only:

| Tier | Key | Backend file |
|------|-----|--------------|
| testing | `testing/coursewright.com/terraform.tfstate` | `backend-testing.hcl` |
| production | `prod/coursewright.com/terraform.tfstate` | `backend-production.hcl` |

```bash
# Prefer scripts from repo root:
./scripts/tf-plan.sh testing
./scripts/tf-apply.sh testing

# Or manually:
cd infra/terraform
terraform init -reconfigure -backend-config=backend-testing.hcl
terraform plan  -var-file=../tfvars/testing.tfvars
```

Never mix a tier’s `-var-file` with the other tier’s backend key.

## Rules

- Prefer **tfvars per tier** over duplicated env roots.
- **Separate state per tier** — never apply production with testing state.
- ACM is a **data lookup** of an ISSUED cert for `coursewright.com` / `*.coursewright.com`.
- Route53 A/AAAA aliases always created in parent zone `coursewright.com` (apex / `beta`).
- Tags: `AppName=coursewright.com`, `Environment=<tier>`, `Owner=Luke Harwood`.

## Don’t

- Commit `SUPABASE_ACCESS_TOKEN` or DB passwords.
- Manage SQL schema inside Terraform (migrations stay files + CLI).
- Create a `supabase_project` resource for the existing production project (password validation + accidental create).
- Sync SPA from a Terraform `null_resource`.
- Point testing SPA at **main** — `build-spa.sh testing` refuses parent keys.
- Run `nuke.sh` against production main.
