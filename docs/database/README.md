# Course Wright — Database Planning

This folder holds **schema design and data modeling notes**. Runtime SQL lives in [`supabase/migrations/`](../../supabase/migrations/) and must follow [SCHEMA.md](./SCHEMA.md). Stack: [STACK.md](../STACK.md).

## Purpose

Document entities, relationships, and constraints so implementation can start from a shared model once product decisions are locked.

## Documents

| File | Description |
|------|-------------|
| [SCHEMA.md](./SCHEMA.md) | Entity list, relationships, RBAC & parent access rules |
| [STACK.md](../STACK.md) | Supabase + React; S3 + CloudFront via Terraform |

## Conventions

- ID format: uuid (`gen_random_uuid()`)
- **Soft delete: yes** — content uses `deleted_at` / `deleted_by`; no hard deletes of user content
- Multi-tenancy: **organization-scoped** (RLS)
- **Audit / versions: yes** — content changes record who, when, and prior state; revert is required
- **CRUD:** PostgREST via frontend where possible; Functions for complex ops — see [STACK.md](../STACK.md)
- **Migrations:** `supabase db migrate`

## Status

**P0 tables are in migrations** — entity rules stay here; SQL follows this document. Phasing:

- **P0:** co-ops and micro-schools; course builder; org management & RBAC; roster management; **student profiles** (no accounts, created on first course enrollment); file sharing (minimum); **print** (material / unit / this week — not a stored entity); parent email invites; link or account access; parent sharing & dashboard
- **P1:** progress, auto-drafted summaries, Course Wright billing orgs, **discussions** (in design)
- **P2:** student accounts; parent family management; orgs collecting from parents
- **P2:** student accounts linked to existing profiles; parent family management across orgs; **quiz online take** (author + print is P0)

P0 field types are locked in [SCHEMA.md](./SCHEMA.md). Quiz is a block on a page — no separate Quiz table.
