#!/usr/bin/env bash
# Seed Doxa Christian Academy on the testing Supabase branch.
#
# Usage:
#   ./scripts/seed-doxa-org.sh
#   ./scripts/seed-doxa-org.sh --reset
#
# Auth: SUPABASE_ACCESS_TOKEN (Management API → service role), or
#       SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
# Refuses the production/parent project.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required (Node >= 24)." >&2
  exit 1
fi

exec npx --yes tsx scripts/seed-doxa/seed.ts --tier testing "$@"
