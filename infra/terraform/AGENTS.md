# AGENTS — `infra/terraform/`

Terraform for Course Wright: **AWS SPA** + **Supabase** (provider). **One root module**, tiers via **`.tfvars`** in sibling `../tfvars/`. Prefer [`scripts/tf-plan.sh`](../../scripts/tf-plan.sh) / [`tf-apply.sh`](../../scripts/tf-apply.sh) over raw CLI.

## Scope

- `modules/spa_site` — S3 + CloudFront OAC + Route53
- `supabase.tf` — provider `supabase/supabase` (token: `SUPABASE_ACCESS_TOKEN`)
  - **testing:** persistent `supabase_branch` (`git_branch = "testing"`) + settings/apikeys on the branch
  - **production:** import existing project `hlecttkgrfhtzvwnxtyb` + settings/apikeys on main
- **`../tfvars/testing.tfvars`** → `beta.coursewright.com` (`coursewright-testing-spa`)
- **`../tfvars/production.tfvars`** → `coursewright.com` (`coursewright-production-spa`)

SPA sync/invalidation is **not** in this module — [`scripts/deploy-spa.sh`](../../scripts/deploy-spa.sh) / GHA (never a `null_resource`). SQL migrations stay CLI ([`scripts/deploy-supabase.sh`](../../scripts/deploy-supabase.sh)).

**Gates:** ACM (HN-005) is ISSUED. Confirm HN-003 (AWS/OIDC) and HN-010 (Environments) before live apply. Supabase Branching must be available on the org/plan (HN-011).

## Remote state

Shared nosh/amia backend (`lukeharwood-dev-tfstate` / `lukeharwood-dev-tf-lock`, `us-east-2`). CourseWright keys only:

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

### Production Supabase project import (one-time)

```bash
cd infra/terraform
terraform init -reconfigure -backend-config=backend-production.hcl
TF_VAR_supabase_db_password='…' terraform import -var-file=../tfvars/production.tfvars \
  'supabase_project.main[0]' hlecttkgrfhtzvwnxtyb
```

Password is ignored after import (`lifecycle.ignore_changes`). Do **not** apply production before import — that would try to create a new project.

## Rules

- Prefer **tfvars per tier** over duplicated env roots.
- **Separate state per tier** — never apply production with testing state.
- ACM is a **data lookup** of an ISSUED cert for `coursewright.com` / `*.coursewright.com`.
- Route53 A/AAAA aliases always created in parent zone `coursewright.com` (apex / `beta`).
- Tags: `AppName=coursewright.com`, `Environment=<tier>`, `Owner=Luke Harwood`.

## Don’t

- Commit `SUPABASE_ACCESS_TOKEN` or DB passwords.
- Manage SQL schema inside Terraform (migrations stay files + CLI).
- Sync SPA from a Terraform `null_resource`.
- Point testing SPA at **main** after the branch exists — use branch URL/keys from outputs.
- Run `nuke.sh` against production main.
