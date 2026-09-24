# AGENTS — `supabase/migrations/`

Versioned SQL: tables, indexes, RLS, Storage policies.

## Scope

- Timestamped `*.sql` migrations
- Policies matching owner / admin / instructor / observer / parent rules. `is_org_staff` is writers only. `can_browse_as_staff` adds observer for SELECT.

## Rules

- **Experiment mode** — see root [AGENTS.md](../../AGENTS.md#experiment-mode). Until that changes, migrations may be dropped and re-added wholesale (squash/rewrite), not only appended. Wipe DB with [`scripts/nuke.sh`](../../scripts/nuke.sh).
- Align with [database/SCHEMA.md](../../docs/database/SCHEMA.md) and FEATURES access rules.
- Prefer **`bigserial` / `bigint`** for auto-incrementing app PKs (and matching FKs); keep **`uuid`** for auth-linked rows (`profiles` / `auth.users`).
- Enable RLS on app tables; parent access gated on enrollment + active **published** course.
- Soft-delete columns for content; no hard-delete of user content as the app path.
- Apply with Supabase CLI migrate workflow.

## Don’t

- Edit remote production schema in the Dashboard without a migration.
- Encode UI copy or React concerns in SQL.
