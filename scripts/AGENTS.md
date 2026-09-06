# AGENTS — `scripts/`

Repo-root utility scripts (not app runtime).

## Contents

| Script | Purpose |
|--------|---------|
| `nuke.sh` | Experiment-mode only: wipe linked/local Supabase DB and re-apply migrations |

## Rules

- Prefer scripts here over one-offs under `supabase/` or `infra/`.
- Destructive scripts must require confirmation (or an explicit `--yes`).
- Document new scripts in this file and link from root [AGENTS.md](../AGENTS.md) when agents should use them.
