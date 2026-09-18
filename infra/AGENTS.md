# AGENTS — `infra/`

AWS SPA hosting + Supabase (Terraform provider). App API remains Supabase (PostgREST / Functions).

## Scope

- Terraform under `terraform/` (spa_site + `supabase.tf`)
- Tier values under `tfvars/`
- Deploy via [`scripts/`](../scripts/) (plan/apply/SPA/Supabase) — GHA calls the same scripts

## Environments

| Env | Domain | Supabase | Terraform |
|-----|--------|----------|-----------|
| production | `coursewright.com` | project main (`hlecttkgrfhtzvwnxtyb`) | `-var-file=../tfvars/production.tfvars` |
| testing | `beta.coursewright.com` | persistent DB branch `testing` | `-var-file=../tfvars/testing.tfvars` |

## Rules

- Terraform owns AWS (S3, CloudFront, ACM/DNS) and Supabase **project/branch/settings** via **tfvars tiers**.
- SQL migrations and Edge Function source deploys stay CLI ([`scripts/deploy-supabase.sh`](../scripts/deploy-supabase.sh)).
- Prefer `./scripts/tf-plan.sh <tier>` from repo root.

## Don’t

- Host a custom Node API as the primary CRUD layer.
- Commit `SUPABASE_ACCESS_TOKEN` or DB passwords.
- Sync SPA from a Terraform `null_resource`.
