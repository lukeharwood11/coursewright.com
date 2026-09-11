# AGENTS — `infra/terraform/modules/spa_site/`

S3 + CloudFront hosting for the CourseWright SPA. Pattern follows [SayNosh.com terraform](https://github.com/lukeharwood11/SayNosh.com/tree/main/terraform) (`s3.tf` / `cdn.tf`).

## What this module creates

- Private S3 bucket (`coursewright-${environment}-spa`), SSE-AES256, public access block
- CloudFront OAC + bucket policy (bucket is not public)
- CloudFront distribution: SPA 403/404 → `/index.html`, `/assets/*` long-cache
- ACM: **data source only** — looks up an **ISSUED** cert in `us-east-1` (HN-005)
- Route53 A/AAAA aliases: **opt-in** via `manage_dns` (default `false`)

## Don’t

- Do not add a `null_resource` / local-exec that syncs `dist/` or invalidates CloudFront on every apply. Deploy upload is a later concern.
- Do not invent ACM cert ARNs or Route53 zone IDs.
- Do not `terraform apply` until HN-003 (AWS creds) **and** an ISSUED ACM cert exists for the tier domain (HN-005).
