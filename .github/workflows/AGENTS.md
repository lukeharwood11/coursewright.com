# AGENTS — `.github/workflows/`

CI/CD YAML. Product behavior is not defined here. Keep YAML thin — call [`scripts/`](../../scripts/).

## Workflows

| File | Trigger | Role |
|------|---------|------|
| `terraform-plan.yml` | `workflow_dispatch` | OIDC + `SUPABASE_ACCESS_TOKEN` → compile-check `npm run build` → `./scripts/tf-plan.sh` → upload `tf.plan` |
| `terraform-apply.yml` | `workflow_dispatch` | Resolve plan run SHA → checkout that commit → `./scripts/tf-apply.sh` → optional `./scripts/deploy-supabase.sh` → `./scripts/build-spa.sh` → `./scripts/deploy-spa.sh` |

Input `tier`: `testing` \| `production`. Optional `plan_run_id`, `deploy_supabase`. Job `environment:` matches the tier.

Apply **rebuilds** `dist/` from Terraform outputs so testing never publishes a stale plan-time `dist/`. Terraform **1.16.3** (must match local; plan files are not portable across versions). Pin in workflow `TERRAFORM_VERSION` and `.terraform-version`.

## Don’t

- Add `push`/`pull_request` triggers for plan/apply.
- Point Node/`npm` at a `web/` subdirectory (nosh layout; CourseWright is repo-root).
- Sync or invalidate from Terraform (`null_resource` / `local-exec`).
- Inline terraform/aws deploy logic that belongs in `scripts/`.
- Apply a `tf.plan` against a different git SHA than the plan was created from.
