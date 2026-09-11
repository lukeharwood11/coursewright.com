locals {
  bucket_name = "coursewright-${var.environment}-spa"
  acm_domain  = coalesce(var.acm_certificate_domain, var.domain_name)
}
