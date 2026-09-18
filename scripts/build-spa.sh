#!/usr/bin/env bash
# Write gitignored .env.production from Terraform outputs (and optional env
# overrides), export those values, then `npm run build`.
#
# Usage: ./scripts/build-spa.sh <testing|production>
#
# testing: Terraform branch outputs only — never parent/main.
# PostHog: VITE_POSTHOG_* env if set, else .env.testing.
# Exports VITE_* so empty CI env vars cannot override .env.production (Vite
# gives process env higher priority than dotenv files).
#
# Requires: terraform state already applied for the tier; npm; dist/ written here.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/terraform-env.sh
source "${SCRIPT_DIR}/lib/terraform-env.sh"

resolve_tier "${1:-}"
require_tools terraform npm

tf_init

URL=""
KEY=""
if [[ "$TIER" == "production" ]]; then
  URL="${VITE_SUPABASE_URL:-}"
  KEY="${VITE_SUPABASE_ANON_KEY:-}"
fi
if [[ -z "$URL" || -z "$KEY" ]]; then
  URL="$(tf_output_raw supabase_url)"
  KEY="$(tf_output_raw supabase_anon_key)"
fi
if [[ -z "$URL" || -z "$KEY" ]]; then
  red "Missing Supabase URL/anon key for ${TIER}."
  red "Apply Terraform for this tier first, then re-run."
  exit 1
fi

if [[ "$TIER" == "testing" ]]; then
  PARENT="$(resolve_parent_project_ref)"
  if [[ "$URL" == *"${PARENT}"* ]]; then
    red "Refusing testing SPA build: supabase_url points at parent main (${PARENT})."
    red "Apply Terraform for testing first so the persistent branch exists, then re-run."
    exit 1
  fi
fi

ENV_FILE="${REPO_ROOT}/.env.production"
cat > "$ENV_FILE" <<EOF
VITE_SUPABASE_URL=${URL}
VITE_SUPABASE_ANON_KEY=${KEY}
EOF

POSTHOG_KEY="${VITE_POSTHOG_KEY:-}"
POSTHOG_HOST="${VITE_POSTHOG_HOST:-}"
if [[ -z "$POSTHOG_KEY" && -f "${REPO_ROOT}/.env.testing" ]]; then
  POSTHOG_KEY="$(grep -E '^VITE_POSTHOG_KEY=' "${REPO_ROOT}/.env.testing" | head -1 | cut -d= -f2- || true)"
  POSTHOG_HOST="$(grep -E '^VITE_POSTHOG_HOST=' "${REPO_ROOT}/.env.testing" | head -1 | cut -d= -f2- || true)"
fi
if [[ -n "$POSTHOG_KEY" ]]; then
  printf 'VITE_POSTHOG_KEY=%s\n' "$POSTHOG_KEY" >> "$ENV_FILE"
  if [[ -n "$POSTHOG_HOST" ]]; then
    printf 'VITE_POSTHOG_HOST=%s\n' "$POSTHOG_HOST" >> "$ENV_FILE"
  fi
fi

# Vite prefers process env over .env files. GHA often sets empty
# vars.VITE_* which would otherwise wipe the values written above.
export VITE_SUPABASE_URL="$URL"
export VITE_SUPABASE_ANON_KEY="$KEY"
if [[ -n "$POSTHOG_KEY" ]]; then
  export VITE_POSTHOG_KEY="$POSTHOG_KEY"
  if [[ -n "$POSTHOG_HOST" ]]; then
    export VITE_POSTHOG_HOST="$POSTHOG_HOST"
  fi
else
  unset VITE_POSTHOG_KEY VITE_POSTHOG_HOST || true
fi

step "Build SPA (${TIER} → ${URL})"
cd "$REPO_ROOT"
npm run build
green "Built dist/ for ${TIER}."
