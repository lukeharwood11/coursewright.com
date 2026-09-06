# AGENTS — `database/`

Human-readable schema and access model. Runtime SQL is translated into `supabase/migrations/` from [SCHEMA.md](./SCHEMA.md) — do not invent extra entities.

## Scope

- `SCHEMA.md`, `README.md`
- Entity rules, RLS intent, P0/P1/P2 entity phasing

## Rules

- Runtime schema lives in `supabase/migrations/` — translate planning → migrations when implementing.
- Keep vocabulary aligned with [FEATURES](../FEATURES.md) / [BRANDING](../BRANDING.md).
- Soft deletes + versioning for content are decided.
- **IDs:** prefer **`bigserial` / `bigint`** for auto-incrementing app PKs and matching FKs; **`uuid`** only where tied to Supabase Auth (`profiles` / `auth.users`). See [SCHEMA.md](./SCHEMA.md) conventions.
- This folder is under `docs/database/` (planning only).

## Don’t

- Put migration SQL here.
- Hand-edit production DB to “match” this folder.
- Invent entities not reflected in FEATURES decisions.
- Default new app tables to UUID PKs when bigserial fits.
