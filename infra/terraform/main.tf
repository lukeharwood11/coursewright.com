# Root module — wires spa_site. Apply with -var-file=../tfvars/testing.tfvars|production.tfvars
# Do not apply until HN-003 (AWS creds) + ISSUED ACM cert in us-east-1 + HN-005 (DNS).
# Init with the matching backend-*.hcl. Always creates Route53 A/AAAA aliases.

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
