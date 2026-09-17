#!/usr/bin/env bash
# Plan AWS + Supabase for a tier. Writes infra/terraform/tf.plan
# Usage: ./scripts/tf-plan.sh <testing|production>
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/terraform-env.sh
source "${SCRIPT_DIR}/lib/terraform-env.sh"

resolve_tier "${1:-}"
require_tools terraform

tf_init

step "Terraform plan (${TIER})"
cd "$TF_DIR"
set +e
terraform plan -input=false -var-file="../tfvars/${TIER}.tfvars" -out=tf.plan -detailed-exitcode
exitcode=$?
set -e

if [[ "$exitcode" -eq 1 ]]; then
  red "Terraform plan failed."
  exit 1
fi

terraform show tf.plan
green "Plan written to ${TF_DIR}/tf.plan (exit ${exitcode}: 0=no changes, 2=changes)."
exit 0
