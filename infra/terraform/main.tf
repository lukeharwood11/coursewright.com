# Root module — wires spa_site. Apply with -var-file=testing.tfvars|production.tfvars
# Blocked on HN-003 (AWS) / HN-004 (state) / HN-005 (DNS) for a real apply.

module "spa_site" {
  source = "./modules/spa_site"

  environment = var.environment
  domain_name = var.domain_name
}

output "spa_bucket_name" {
  value       = module.spa_site.bucket_name
  description = "S3 bucket for Vite dist/ uploads (placeholder until module is real)"
}

output "cloudfront_domain" {
  value       = module.spa_site.cloudfront_domain
  description = "CloudFront domain — point DNS here after HN-005"
}
