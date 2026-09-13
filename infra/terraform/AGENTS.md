# AGENTS — `infra/terraform/`

Terraform for Course Wright AWS SPA hosting. **One root module**, many tiers via **`.tfvars`** in sibling `../tfvars/`.

## Scope

- Root module + `modules/spa_site` — S3 + CloudFront OAC + Route53
- **`../tfvars/testing.tfvars`** → `justtesting.coursewright.com` (`coursewright-testing-spa`)
- **`../tfvars/production.tfvars`** → `coursewright.com` (`coursewright-production-spa`)

Same code path for every tier; only var files change.

**Do not `terraform apply` (local or GHA) until HN-003 (AWS/OIDC) and an ISSUED ACM certificate exists in `us-east-1` covering `coursewright.com` + `*.coursewright.com` (HN-005).** Deploy sync/invalidation is **not** in this module — GitHub Actions `terraform-apply.yml` runs `aws s3 sync` + CloudFront invalidate as shell steps (never a `null_resource`).

## Remote state

Shared nosh/amia backend (`lukeharwood-dev-tfstate` / `lukeharwood-dev-tf-lock` in `us-east-2`). CourseWright only adds **keys** — do not create a new bucket or lock table.

`backend.tf` holds bucket/table/region. Per-tier `key` lives in partial backend configs because the S3 backend key is not tfvars-driven.

```bash
# Testing
terraform init -backend-config=backend-testing.hcl
terraform plan  -var-file=../tfvars/testing.tfvars
terraform apply -var-file=../tfvars/testing.tfvars

# Production (reconfigure when switching from testing, or first init of this key)
terraform init -reconfigure -backend-config=backend-production.hcl
terraform plan  -var-file=../tfvars/production.tfvars
terraform apply -var-file=../tfvars/production.tfvars
```

Never mix a tier’s `-var-file` with the other tier’s backend key.

CI (`.github/workflows/terraform-plan.yml` / `terraform-apply.yml`) uses the same pairing via dispatch input `tier`. **Do not dispatch apply** until HN-005 ACM is ISSUED and HN-003 is done.

## Rules

- Prefer **tfvars per tier** (in `../tfvars/`) over copy-pasted `envs/testing` and `envs/production` roots.
- **Separate state per tier** (workspace or backend key) — never apply production with testing state.
- Parameterize domain, bucket names, aliases, tags (`environment = "testing" | "production"`).
- SPA fallback for client-side routing (CloudFront 403/404 → `index.html`).
- ACM is a **data lookup** of an ISSUED cert for `coursewright.com` (covers apex + `*.coursewright.com`) — do not invent ARNs; Luke issues the cert first (HN-005).
- Route53 A/AAAA aliases are **always** created in parent zone `coursewright.com` (apex and `justtesting` subdomain).
- Only AWS resources needed for the static app + DNS/TLS.
- Tags: `AppName=coursewright`, `Environment=<tier>`, `Owner=Luke Harwood` (provider `default_tags`).

## Don’t

- Duplicate the whole stack in per-env folders when tfvars suffice.
- Manage Supabase Postgres schema with Terraform.
- Commit secrets in tfvars; use env vars / CI roles / secret stores for credentials.
- Apply the wrong `-var-file` against the wrong state.
