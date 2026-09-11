# Infra

Terraform under `terraform/`. Deploy the Vite `dist/` to the tier’s S3 bucket after apply.

- Human blockers: [docs/HUMAN_NEEDED.md](../docs/HUMAN_NEEDED.md) (HN-003, HN-005)
- Remote state: shared nosh/amia backend; init with `backend-testing.hcl` / `backend-production.hcl`
- See [AGENTS.md](./AGENTS.md) and [terraform/AGENTS.md](./terraform/AGENTS.md)
