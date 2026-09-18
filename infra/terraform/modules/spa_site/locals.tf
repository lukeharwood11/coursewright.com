locals {
  bucket_name = "coursewright-${var.environment}-spa"
  acm_domain  = var.acm_certificate_domain
}
