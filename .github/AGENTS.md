# AGENTS — `.github/`

GitHub Actions for Course Wright. Workflows live in [`workflows/`](./workflows/AGENTS.md).

## Rules

- **Dispatch-only** Terraform: `terraform-plan.yml` and `terraform-apply.yml`. No `push` / `pull_request` deploy.
- Pattern after [SayNosh.com](https://github.com/lukeharwood11/SayNosh.com) plan/apply, adapted to this repo (Vite app at repo root → `dist/`, Terraform under `infra/terraform/`).
- **Do not run apply** until Luke’s ISSUED `us-east-1` ACM cert (HN-005) and HN-003 AWS/OIDC creds.
- S3 sync + CloudFront invalidate are **Actions shell steps** on apply — never a Terraform `null_resource`.
