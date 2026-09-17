#!/usr/bin/env bash
# Shared helpers for Terraform + deploy scripts.
# shellcheck shell=bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TF_DIR="${REPO_ROOT}/infra/terraform"

red()   { printf '\033[1;31m%s\033[0m\n' "$*"; }
green() { printf '\033[1;32m%s\033[0m\n' "$*"; }
step()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

require_tools() {
  local missing=0
  local cmd
  for cmd in "$@"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      red "Required tool '$cmd' not found on PATH."
      missing=1
    fi
  done
  if [[ "$missing" -ne 0 ]]; then
    exit 1
  fi
}

# Sets: TIER, BACKEND_CONFIG, VAR_FILE (absolute), TF_DIR
resolve_tier() {
  local tier="${1:-}"
  if [[ "$tier" != "testing" && "$tier" != "production" ]]; then
    red "Usage: $0 <testing|production> [--yes]"
    exit 1
  fi
  TIER="$tier"
  BACKEND_CONFIG="backend-${tier}.hcl"
  VAR_FILE="${REPO_ROOT}/infra/tfvars/${tier}.tfvars"
  if [[ ! -f "${TF_DIR}/${BACKEND_CONFIG}" ]]; then
    red "Missing backend config: ${TF_DIR}/${BACKEND_CONFIG}"
    exit 1
  fi
  if [[ ! -f "$VAR_FILE" ]]; then
    red "Missing var file: ${VAR_FILE}"
    exit 1
  fi
}

tf_init() {
  step "Terraform init (${TIER})"
  (
    cd "$TF_DIR"
    terraform init -input=false -reconfigure -backend-config="${BACKEND_CONFIG}"
  )
}

tf_var_file_arg() {
  # Path relative to TF_DIR
  echo "-var-file=../tfvars/${TIER}.tfvars"
}
