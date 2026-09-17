# AGENTS — `.github/`

GitHub Actions for Course Wright. Workflows live in [`workflows/`](./workflows/AGENTS.md).

## Rules

- **Dispatch-only** Terraform: `terraform-plan.yml` and `terraform-apply.yml`. No `push` / `pull_request` deploy.
- Workflows call [`scripts/tf-plan.sh`](../scripts/tf-plan.sh), [`tf-apply.sh`](../scripts/tf-apply.sh), [`deploy-spa.sh`](../scripts/deploy-spa.sh), [`deploy-supabase.sh`](../scripts/deploy-supabase.sh).
- Secrets: AWS via OIDC (`arn:aws:iam::891612573605:role/github-oidc`); **`SUPABASE_ACCESS_TOKEN`** as Actions secret.
- S3 sync + CloudFront invalidate are **scripts/Actions** — never a Terraform `null_resource`.
- Confirm HN-003 / HN-010 before live apply (ACM HN-005 is done).
