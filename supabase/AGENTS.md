# AGENTS — `supabase/`

Supabase CLI project: config, migrations, Edge Functions.

## Scope

- `config.toml`, `seed.sql`
- `migrations/` — applied schema
- `functions/` — complex use cases only

## Rules

- Schema changes via **`supabase db migrate`** / migration files — never rely on remote Dashboard as source of truth.
- PostgREST + RLS for CRUD; Functions for complexity ([STACK.md](../docs/STACK.md)).
- Name Functions after **use cases**, not `api` or `handler`.
- **Experiment mode** — [`scripts/nuke.sh`](../scripts/nuke.sh) resets linked (default) or local DB and re-applies migrations. See root [AGENTS.md](../AGENTS.md#experiment-mode). Only while experiment mode is active.

## Don’t

- Build a general custom REST API in Functions.
- Duplicate planning prose here — link to `docs/database/SCHEMA.md`.
- Run `nuke.sh` against a production project except via `--production` (experiment mode), or after experiment mode ends.
