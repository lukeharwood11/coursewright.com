# AGENTS — `infra/tfvars/`

Tier var files for the Terraform root in `../terraform/`. Prefer [`scripts/tf-plan.sh`](../../scripts/tf-plan.sh) from repo root.

| File | Domain | Notes |
|------|--------|-------|
| `testing.tfvars` | `beta.coursewright.com` | Persistent Supabase branch off parent project |
| `production.tfvars` | `coursewright.com` | Settings/apikeys on existing project by ref |

Pair each file with the matching backend key (`backend-testing.hcl` / `backend-production.hcl`). Do not commit secrets here (`SUPABASE_ACCESS_TOKEN` stays in the environment).
