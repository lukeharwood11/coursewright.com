# AGENTS — `infra/terraform/modules/spa_site/`

S3 + CloudFront hosting for the CourseWright SPA. Pattern follows [SayNosh.com terraform](https://github.com/lukeharwood11/SayNosh.com/tree/main/terraform) (`s3.tf` / `cdn.tf`).

## What this module creates

- Private S3 bucket (`coursewright-${environment}-spa`), SSE-AES256, public access block
- CloudFront OAC + bucket policy (bucket is not public)
- CloudFront distribution: SPA 403/404 → `/index.html`, `/assets/*` long-cache, `price_class = PriceClass_100` (US/CA/EU)
- ACM: **data source only** — looks up an **ISSUED** cert for `coursewright.com` (covers apex + `*.coursewright.com`, including `beta`) in `us-east-1` (HN-005)
- Route53 A/AAAA aliases for `domain_name` in the parent zone

## Don’t

- Do not add a `null_resource` / local-exec that syncs `dist/` or invalidates CloudFront. Deploy upload is [`scripts/deploy-spa.sh`](../../../../scripts/deploy-spa.sh) / GHA.
- Do not invent ACM cert ARNs or Route53 zone IDs.
