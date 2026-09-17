#!/usr/bin/env bash
# Write gitignored .env.production from Terraform outputs (and optional env
# overrides) then `npm run build`.
#
# Usage: ./scripts/build-spa.sh <testing|production>
#
# testing: Terraform branch outputs only — never parent/main.
# PostHog: VITE_POSTHOG_* env if set, else .env.testing.
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

if [[ -n "${VITE_POSTHOG_KEY:-}" ]]; then
  printf 'VITE_POSTHOG_KEY=%s\n' "$VITE_POSTHOG_KEY" >> "$ENV_FILE"
  if [[ -n "${VITE_POSTHOG_HOST:-}" ]]; then
    printf 'VITE_POSTHOG_HOST=%s\n' "$VITE_POSTHOG_HOST" >> "$ENV_FILE"
  fi
elif [[ -f "${REPO_ROOT}/.env.testing" ]]; then
  grep -E '^VITE_POSTHOG_' "${REPO_ROOT}/.env.testing" >> "$ENV_FILE" || true
fi

step "Build SPA (${TIER} → ${URL})"
cd "$REPO_ROOT"
npm run build
green "Built dist/ for ${TIER}."
