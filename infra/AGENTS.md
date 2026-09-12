# AGENTS — `infra/`

AWS hosting for the SPA. App API remains Supabase.

## Scope

- Terraform under `terraform/`
- Deploy notes for uploading `dist/` to S3 (GHA apply steps, not Terraform)

## Environments

| Env | Domain | Terraform |
|-----|--------|-----------|
| production | `coursewright.com` | `-var-file=production.tfvars` |
| testing | `justtesting.coursewright.com` | `-var-file=testing.tfvars` |

## Rules

- Terraform owns AWS (S3, CloudFront, ACM/DNS as needed) via **tfvars tiers**.
- Supabase schema/Functions are **not** managed here.

## Don’t

- Host a custom Node API as the primary CRUD layer.
- Put Supabase secrets in Terraform state carelessly — use proper secret handling.
