# Root module — wires spa_site. Apply with -var-file=testing.tfvars|production.tfvars
# Do not apply until HN-003 (AWS creds) + ISSUED ACM cert in us-east-1 + HN-005 (DNS).
# Init with the matching backend-*.hcl. DNS records are opt-in (manage_dns, default false).

module "spa_site" {
  source = "./modules/spa_site"

  environment            = var.environment
  domain_name            = var.domain_name
  manage_dns             = var.manage_dns
  route53_zone_name      = var.route53_zone_name
  acm_certificate_domain = var.acm_certificate_domain
}

output "spa_bucket_name" {
  value       = module.spa_site.bucket_name
  description = "S3 bucket for Vite dist/ uploads"
}

output "cloudfront_domain" {
  value       = module.spa_site.cloudfront_domain
  description = "CloudFront domain — point DNS here after HN-005 if manage_dns is false"
}

output "cloudfront_distribution_id" {
  value       = module.spa_site.cloudfront_distribution_id
  description = "CloudFront distribution ID"
}

output "acm_certificate_arn" {
  value       = module.spa_site.acm_certificate_arn
  description = "ISSUED ACM certificate ARN looked up in us-east-1 (HN-005)"
}
