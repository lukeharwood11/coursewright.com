#!/usr/bin/env bash
# Sync repo-root dist/ to the tier's SPA bucket and invalidate CloudFront.
# Usage: ./scripts/deploy-spa.sh <testing|production>
# Expects dist/ at repo root and Terraform state already applied for the tier.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/terraform-env.sh
source "${SCRIPT_DIR}/lib/terraform-env.sh"

resolve_tier "${1:-}"
require_tools terraform aws

DIST_DIR="${REPO_ROOT}/dist"
if [[ ! -d "$DIST_DIR" ]]; then
  red "Missing dist/ at ${DIST_DIR}. Build the SPA first."
  exit 1
fi
if [[ ! -f "${DIST_DIR}/index.html" ]]; then
  red "Missing ${DIST_DIR}/index.html — build looks incomplete."
  exit 1
fi

tf_init

step "Sync SPA to S3 + invalidate CloudFront (${TIER})"
cd "$TF_DIR"

BUCKET="$(terraform output -raw spa_bucket_name 2>/dev/null || true)"
DIST_ID="$(terraform output -raw cloudfront_distribution_id 2>/dev/null || true)"

if [[ -z "$BUCKET" ]]; then
  BUCKET="coursewright-${TIER}-spa"
  echo "spa_bucket_name output empty; falling back to ${BUCKET}"
fi
if [[ -z "$DIST_ID" ]]; then
  red "cloudfront_distribution_id output is empty — apply Terraform for this tier first."
  exit 1
fi

aws s3 sync "${DIST_DIR}/" "s3://${BUCKET}" --delete \
  --exclude "privacy" --exclude "terms" --exclude "cookies"

# Extensionless legal HTML (built by vite-seo-assets) must be text/html so
# verifiers/crawlers that do not run JS still see the policy body at /privacy etc.
for page in privacy terms cookies; do
  if [[ ! -f "${DIST_DIR}/${page}" ]]; then
    red "Missing ${DIST_DIR}/${page} — rebuild the SPA (legal prerender)."
    exit 1
  fi
  aws s3 cp "${DIST_DIR}/${page}" "s3://${BUCKET}/${page}" \
    --content-type "text/html; charset=utf-8" \
    --cache-control "public, max-age=60"
done

aws cloudfront create-invalidation --distribution-id "${DIST_ID}" --paths "/*"
green "Deployed dist/ → s3://${BUCKET} (CloudFront ${DIST_ID})."
