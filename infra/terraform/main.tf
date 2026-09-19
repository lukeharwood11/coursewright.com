# Root module — wires spa_site + supabase (see supabase.tf).
# Prefer ./scripts/tf-plan.sh|tf-apply.sh <tier> from repo root.
# Init with the matching backend-*.hcl. Always creates Route53 A/AAAA aliases.
# ACM (HN-005) issued; confirm HN-003 / HN-010 / HN-011 before live apply.

module "spa_site" {
  source = "./modules/spa_site"

  environment            = var.environment
  domain_name            = var.domain_name
  route53_zone_name      = var.route53_zone_name
  acm_certificate_domain = var.acm_certificate_domain
}

output "spa_bucket_name" {
  value       = module.spa_site.bucket_name
  description = "S3 bucket for Vite dist/ uploads"
}

output "cloudfront_domain" {
  value       = module.spa_site.cloudfront_domain
  description = "CloudFront distribution domain name"
}

output "cloudfront_distribution_id" {
  value       = module.spa_site.cloudfront_distribution_id
  description = "CloudFront distribution ID"
}

output "acm_certificate_arn" {
  value       = module.spa_site.acm_certificate_arn
  description = "ISSUED ACM certificate ARN looked up in us-east-1 (HN-005)"
}

output "site_domain" {
  value       = var.domain_name
  description = "Public site hostname (coursewright.com or beta.coursewright.com)"
}
