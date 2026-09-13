# AGENTS — `.github/workflows/`

CI/CD YAML. Product behavior is not defined here.

## Workflows

| File | Trigger | Role |
|------|---------|------|
| `terraform-plan.yml` | `workflow_dispatch` | OIDC → `npm ci` + `npm run build` → `dist/` → `terraform init` + `plan` → upload `tf.plan` + `dist/` |
| `terraform-apply.yml` | `workflow_dispatch` | Download matching plan artifacts → `terraform apply tf.plan` → `aws s3 sync` + CloudFront invalidate |

Input `tier`: `testing` \| `production`. Job `environment:` matches the tier so **production** can require GitHub Environment reviewers.

## Don’t

- Add `push`/`pull_request` triggers for plan/apply.
- Point Node/`npm` at a `web/` subdirectory (that is nosh; CourseWright is repo-root).
- Sync or invalidate from Terraform (`null_resource` / `local-exec`).
- Dispatch **apply** until HN-005 ACM is ISSUED in `us-east-1` and HN-003 is done.
