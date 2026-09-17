#!/usr/bin/env bash
# One-shot local deploy for a tier: plan → apply → supabase → build → SPA sync.
# Usage:
#   ./scripts/deploy.sh testing
#   ./scripts/deploy.sh production --yes
#
# Requires: AWS creds, SUPABASE_ACCESS_TOKEN, terraform, aws, npm, supabase.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/terraform-env.sh
source "${SCRIPT_DIR}/lib/terraform-env.sh"

TIER_ARG="${1:-}"
YES=0
shift || true
for arg in "$@"; do
  case "$arg" in
    --yes|-y) YES=1 ;;
  esac
done

resolve_tier "$TIER_ARG"
require_tools terraform aws npm supabase

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  red "SUPABASE_ACCESS_TOKEN is not set."
  exit 1
fi

if [[ "$TIER" == "production" && "$YES" -ne 1 ]]; then
  red "Refusing production deploy without --yes"
  exit 1
fi

step "Plan (${TIER})"
bash "${SCRIPT_DIR}/tf-plan.sh" "$TIER"

step "Apply (${TIER})"
bash "${SCRIPT_DIR}/tf-apply.sh" "$TIER"

step "Supabase (${TIER})"
bash "${SCRIPT_DIR}/deploy-supabase.sh" "$TIER"

step "Build SPA (${TIER})"
cd "$REPO_ROOT"
npm ci --silent
bash "${SCRIPT_DIR}/build-spa.sh" "$TIER"

step "Publish SPA (${TIER})"
bash "${SCRIPT_DIR}/deploy-spa.sh" "$TIER"

green "Deploy complete for ${TIER}."
