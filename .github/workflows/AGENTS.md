# AGENTS — `.github/workflows/`

CI/CD YAML. Product behavior is not defined here. Keep YAML thin — call [`scripts/`](../../scripts/).

## Workflows

| File | Trigger | Role |
|------|---------|------|
| `terraform-plan.yml` | `workflow_dispatch` | OIDC + `SUPABASE_ACCESS_TOKEN` → build `dist/` → `./scripts/tf-plan.sh` → upload `tf.plan` + `dist/` |
| `terraform-apply.yml` | `workflow_dispatch` | Download plan artifacts → `./scripts/tf-apply.sh` → optional `./scripts/deploy-supabase.sh` → `./scripts/deploy-spa.sh` |

Input `tier`: `testing` \| `production`. Optional `plan_run_id`, `deploy_supabase`. Job `environment:` matches the tier.

## Don’t

- Add `push`/`pull_request` triggers for plan/apply.
- Point Node/`npm` at a `web/` subdirectory (nosh layout; CourseWright is repo-root).
- Sync or invalidate from Terraform (`null_resource` / `local-exec`).
- Inline terraform/aws deploy logic that belongs in `scripts/`.
