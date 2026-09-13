# AGENTS — `infra/terraform/`

Terraform for Course Wright AWS SPA hosting. **One root module**, many tiers via **`.tfvars`**.

## Scope

- Root module + `modules/spa_site` — S3 + CloudFront OAC + optional Route53
- **`testing.tfvars`** → `justtesting.coursewright.com` (`coursewright-testing-spa`)
- **`production.tfvars`** → `coursewright.com` (`coursewright-production-spa`)

Same code path for every tier; only var files change.

**Do not `terraform apply` until HN-003 (AWS creds) and an ISSUED ACM certificate exists in `us-east-1` for the tier domain (HN-005).** Route53 aliases stay off until `manage_dns = true`. Deploy sync/invalidation is not in this module.

## Remote state

Shared nosh/amia backend (`lukeharwood-dev-tfstate` / `lukeharwood-dev-tf-lock` in `us-east-2`). CourseWright only adds **keys** — do not create a new bucket or lock table.

`backend.tf` holds bucket/table/region. Per-tier `key` lives in partial backend configs because the S3 backend key is not tfvars-driven.

```bash
# Testing
terraform init -backend-config=backend-testing.hcl
terraform plan  -var-file=testing.tfvars
terraform apply -var-file=testing.tfvars

# Production (reconfigure when switching from testing, or first init of this key)
terraform init -reconfigure -backend-config=backend-production.hcl
terraform plan  -var-file=production.tfvars
terraform apply -var-file=production.tfvars
```

Never mix a tier’s `-var-file` with the other tier’s backend key.

## Rules

- Prefer **tfvars per tier** over copy-pasted `envs/testing` and `envs/production` roots.
- **Separate state per tier** (workspace or backend key) — never apply production with testing state.
- Parameterize domain, bucket names, aliases, tags (`environment = "testing" | "production"`).
- SPA fallback for client-side routing (CloudFront 403/404 → `index.html`).
- ACM is a **data lookup** of an ISSUED cert — do not invent ARNs; Luke issues the cert first (HN-005).
- Route53 is **opt-in** (`manage_dns`, default `false`). Parent zone is `coursewright.com` for both apex and `justtesting`.
- Only AWS resources needed for the static app + DNS/TLS.
- Tags: `AppName=coursewright`, `Environment=<tier>`, `Owner=Luke Harwood` (provider `default_tags`).

## Don’t

- Duplicate the whole stack in per-env folders when tfvars suffice.
- Manage Supabase Postgres schema with Terraform.
- Commit secrets in tfvars; use env vars / CI roles / secret stores for credentials.
- Apply the wrong `-var-file` against the wrong state.
