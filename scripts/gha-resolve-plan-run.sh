#!/usr/bin/env bash
# Resolve the Terraform Plan workflow run to apply (same tier artifact + git SHA).
# Writes run_id and sha to GITHUB_OUTPUT when running in Actions.
#
# Usage: ./scripts/gha-resolve-plan-run.sh <testing|production> [plan_run_id]
# Requires: gh, GITHUB_REPOSITORY, GH_TOKEN / GITHUB_TOKEN
set -euo pipefail

TIER="${1:-}"
PLAN_RUN_ID="${2:-}"
REPO="${GITHUB_REPOSITORY:-}"

if [[ "$TIER" != "testing" && "$TIER" != "production" ]]; then
  echo "Usage: $0 <testing|production> [plan_run_id]" >&2
  exit 1
fi
if [[ -z "$REPO" ]]; then
  echo "GITHUB_REPOSITORY is not set." >&2
  exit 1
fi
if ! command -v gh >/dev/null 2>&1; then
  echo "gh is required." >&2
  exit 1
fi

ARTIFACT="terraform-plan-${TIER}"

artifact_count() {
  local run_id="$1"
  gh api "repos/${REPO}/actions/runs/${run_id}/artifacts" \
    --jq "[.artifacts[] | select(.name==\"${ARTIFACT}\" and .expired==false)] | length"
}

RUN_ID=""
if [[ -n "$PLAN_RUN_ID" ]]; then
  RUN_ID="$PLAN_RUN_ID"
  CONCLUSION="$(gh api "repos/${REPO}/actions/runs/${RUN_ID}" --jq .conclusion)"
  if [[ "$CONCLUSION" != "success" ]]; then
    echo "Plan run ${RUN_ID} conclusion is '${CONCLUSION}', expected success." >&2
    exit 1
  fi
  COUNT="$(artifact_count "$RUN_ID")"
  if [[ "$COUNT" -lt 1 ]]; then
    echo "Plan run ${RUN_ID} has no unexpired artifact ${ARTIFACT}." >&2
    exit 1
  fi
else
  while IFS= read -r id; do
    [[ -z "$id" ]] && continue
    COUNT="$(artifact_count "$id")"
    if [[ "$COUNT" -gt 0 ]]; then
      RUN_ID="$id"
      break
    fi
  done < <(gh api --paginate "repos/${REPO}/actions/workflows/terraform-plan.yml/runs?status=success&event=workflow_dispatch" \
    --jq '.workflow_runs[].id')
fi

if [[ -z "$RUN_ID" ]]; then
  echo "No successful Terraform Plan run with artifact ${ARTIFACT}." >&2
  echo "Dispatch terraform-plan.yml for tier=${TIER} first." >&2
  exit 1
fi

SHA="$(gh api "repos/${REPO}/actions/runs/${RUN_ID}" --jq .head_sha)"
if [[ -z "$SHA" || "$SHA" == "null" ]]; then
  echo "Could not read head_sha for plan run ${RUN_ID}." >&2
  exit 1
fi

echo "Resolved plan run ${RUN_ID} (${ARTIFACT}) at ${SHA}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "run_id=${RUN_ID}" >> "$GITHUB_OUTPUT"
  echo "sha=${SHA}" >> "$GITHUB_OUTPUT"
fi
