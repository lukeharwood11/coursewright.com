# AGENTS — `infra/terraform/`

Terraform for Course Wright AWS SPA hosting. **One root module**, many tiers via **`.tfvars`**.

## Scope

- Root module + `modules/spa_site` — S3 + CloudFront (+ ACM/DNS as designed)
- **`testing.tfvars`** → `justtesting.coursewright.com`
- **`production.tfvars`** → `coursewright.com`

Same code path for every tier; only var files change.

## Apply

```bash
terraform plan  -var-file=testing.tfvars
terraform apply -var-file=testing.tfvars

terraform plan  -var-file=production.tfvars
terraform apply -var-file=production.tfvars
```

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
