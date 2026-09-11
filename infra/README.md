# Infra

Terraform under `terraform/`. Deploy the Vite `dist/` to the tier’s S3 bucket after apply.

- Human blockers: [docs/HUMAN_NEEDED.md](../docs/HUMAN_NEEDED.md) (HN-003 AWS creds, HN-005 ACM cert in us-east-1 + DNS). **Do not apply** until both are done.
- Remote state: shared nosh/amia backend; init with `backend-testing.hcl` / `backend-production.hcl`
- `spa_site` module: private S3 + CloudFront OAC; Route53 aliases opt-in (`manage_dns = false` by default)
- See [AGENTS.md](./AGENTS.md) and [terraform/AGENTS.md](./terraform/AGENTS.md)
