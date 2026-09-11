# AGENTS — `infra/terraform/`

Terraform for Course Wright AWS SPA hosting. **One root module**, many tiers via **`.tfvars`**.

## Scope

- Root module + `modules/spa_site` — S3 + CloudFront (+ ACM/DNS as designed)
- **`testing.tfvars`** → `justtesting.coursewright.com`
- **`production.tfvars`** → `coursewright.com`

Same code path for every tier; only var files change.

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
- SPA fallback for client-side routing (CloudFront → `index.html`).
- Only AWS resources needed for the static app + DNS/TLS.

## Don’t

- Duplicate the whole stack in per-env folders when tfvars suffice.
- Manage Supabase Postgres schema with Terraform.
- Commit secrets in tfvars; use env vars / CI roles / secret stores for credentials.
- Apply the wrong `-var-file` against the wrong state.
