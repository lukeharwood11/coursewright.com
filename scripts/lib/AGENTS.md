# AGENTS — `scripts/lib/`

Shared helpers for deploy / Terraform scripts. Sourced by scripts in the parent folder — not run directly.

| File | Role |
|------|------|
| `terraform-env.sh` | Tier resolution (`testing` \| `production`), `TF_DIR`, backend/tfvars paths, logging, `require_tools`, parent-project ref helpers |

Do not put secrets here. Callers must provide AWS creds and `SUPABASE_ACCESS_TOKEN` via the environment.
