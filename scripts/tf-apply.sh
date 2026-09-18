#!/usr/bin/env bash
# Apply a saved plan for a tier (infra/terraform/tf.plan).
# Usage: ./scripts/tf-apply.sh <testing|production>
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/terraform-env.sh
source "${SCRIPT_DIR}/lib/terraform-env.sh"

resolve_tier "${1:-}"
require_tools terraform

PLAN_FILE="${TF_DIR}/tf.plan"
if [[ ! -f "$PLAN_FILE" ]]; then
  red "Missing plan file: ${PLAN_FILE}"
  red "Run ./scripts/tf-plan.sh ${TIER} first."
  exit 1
fi

tf_init

step "Terraform apply (${TIER})"
cd "$TF_DIR"
terraform apply -input=false tf.plan
green "Apply complete for ${TIER}."
