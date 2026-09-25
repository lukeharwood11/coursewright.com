#!/usr/bin/env bash
# Push migrations + deploy Edge Functions to the tier's Supabase target.
# testing  → persistent branch project ref ONLY (never parent/main)
# production → main project
#
# Usage: ./scripts/deploy-supabase.sh <testing|production>
# Requires: SUPABASE_ACCESS_TOKEN, supabase CLI, Terraform state for the tier.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/terraform-env.sh
source "${SCRIPT_DIR}/lib/terraform-env.sh"

resolve_tier "${1:-}"
require_tools terraform supabase

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  red "SUPABASE_ACCESS_TOKEN is not set (needed for Management API / CLI)."
  exit 1
fi

tf_init

PROJECT_REF="$(tf_output_raw supabase_project_ref)"
PARENT_REF="$(resolve_parent_project_ref)"

if [[ -z "$PROJECT_REF" ]]; then
  red "supabase_project_ref output empty — apply Terraform for ${TIER} first."
  exit 1
fi

# Safety: testing migrations must never hit the parent/main project.
if [[ "$TIER" == "testing" ]]; then
  if [[ "$PROJECT_REF" == "$PARENT_REF" ]]; then
    red "Refusing testing migrations: supabase_project_ref equals parent main (${PARENT_REF})."
    red "Apply Terraform for testing first so the persistent branch exists, then re-run."
    exit 1
  fi
  BRANCH_ID="$(tf_output_raw supabase_branch_id)"
  if [[ -z "$BRANCH_ID" ]]; then
    red "Refusing testing migrations: supabase_branch_id is empty — branch not in state."
    exit 1
  fi
  step "Target confirmed: testing branch ref ${PROJECT_REF} (branch id ${BRANCH_ID}, parent ${PARENT_REF})"
else
  if [[ "$PROJECT_REF" != "$PARENT_REF" ]]; then
    red "Refusing production migrations: expected parent main (${PARENT_REF}), got ${PROJECT_REF}."
    exit 1
  fi
  step "Target confirmed: production main ${PROJECT_REF}"
fi

step "Supabase migrations (${TIER} → ${PROJECT_REF})"
cd "$REPO_ROOT"
supabase link --project-ref "$PROJECT_REF" --yes
# --include-all: allow a local migration whose timestamp sorts before the
# remote tip (e.g. prod applied 20261004000001 before 20261004000000 existed).
# No-op when history is already linear — safe for testing.
supabase db push --linked --yes --include-all

step "Deploy Edge Functions (${TIER} → ${PROJECT_REF})"
FUNCTIONS_DIR="${REPO_ROOT}/supabase/functions"
if [[ -d "$FUNCTIONS_DIR" ]]; then
  shopt -s nullglob
  for dir in "${FUNCTIONS_DIR}"/*/; do
    name="$(basename "$dir")"
    [[ "$name" == _* ]] && continue
    [[ -f "${dir}index.ts" ]] || continue
    supabase functions deploy "$name" --project-ref "$PROJECT_REF" --use-api
  done
  shopt -u nullglob
fi

green "Supabase deploy complete for ${TIER} (${PROJECT_REF})."
