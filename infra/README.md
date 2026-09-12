# Infra

Terraform under `terraform/`. Deploy the Vite `dist/` to the tier’s S3 bucket after apply.

- Human blockers: [docs/HUMAN_NEEDED.md](../docs/HUMAN_NEEDED.md) (HN-003 AWS/OIDC, HN-005 ACM cert in us-east-1 + DNS, HN-010 GitHub Environments). **Do not apply** until HN-003 + ISSUED ACM (HN-005).
- Remote state: shared nosh/amia backend; init with `backend-testing.hcl` / `backend-production.hcl`
- `spa_site` module: private S3 + CloudFront OAC; Route53 aliases opt-in (`manage_dns = false` by default)
- See [AGENTS.md](./AGENTS.md) and [terraform/AGENTS.md](./terraform/AGENTS.md)

## GitHub Actions (plan / apply)

Dispatch-only workflows (nosh-style): [`.github/workflows/terraform-plan.yml`](../.github/workflows/terraform-plan.yml) and [`.github/workflows/terraform-apply.yml`](../.github/workflows/terraform-apply.yml).

| | Testing | Production |
|--|---------|------------|
| Dispatch input | `tier=testing` (default) | `tier=production` |
| Backend | `backend-testing.hcl` | `backend-production.hcl` |
| Vars | `testing.tfvars` | `production.tfvars` |
| Gate | GitHub Environment `testing` (no required reviewers) | GitHub Environment `production` (required reviewers — HN-010) |

Plan: checkout → OIDC (`arn:aws:iam::891612573605:role/github-oidc`) → `npm ci` + `npm run build` → repo-root `dist/` → `terraform init` + `plan -out=tf.plan` → upload `tf.plan` + `dist/`.

Apply: download those artifacts from the matching plan run → `terraform init` + `apply tf.plan` → **Actions** `aws s3 sync` of `dist/` to `spa_bucket_name` (fallback `coursewright-${tier}-spa`) → CloudFront invalidate. No Terraform `null_resource`.

**Do not dispatch apply** until Luke’s ACM certificate is **ISSUED** in `us-east-1` (HN-005) and HN-003 AWS/OIDC access is confirmed. The workflows are code-only until then.
