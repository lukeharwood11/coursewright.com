# AGENTS — `supabase/tests/`

pgTAP tests for schema and RLS. Run with `supabase test db` (local).

## Scope

- `*.sql` files under this folder
- Assert SCHEMA.md access rules: owner / admin / instructor / parent, last-owner-or-admin guard, parent course gate

## Rules

- Test against tables in `supabase/migrations/`, not a parallel fixture schema.
- Pair deny-updates with a check that the targeted row is unchanged.
- Seed `auth.users` so the `profiles` trigger runs.

## Don’t

- Grant extra privileges in tests that production migrations do not.
- Skip the parent access gate (`Course.status = active` + `visibility = published` + enrollment + link).
