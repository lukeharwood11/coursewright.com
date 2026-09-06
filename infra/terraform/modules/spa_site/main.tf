variable "environment" {
  type = string
}

variable "domain_name" {
  type = string
}

# Stub resources — replace with real S3 + CloudFront + ACM after HN-003/HN-004/HN-005.
# Intentionally no AWS resources yet so `terraform validate` can work once init'd
# without creating billable infra by accident.

locals {
  name_prefix = "coursewright-${var.environment}"
}

output "bucket_name" {
  value       = "${local.name_prefix}-spa-PLACEHOLDER"
  description = "HUMAN_NEEDED HN-003+: real bucket after module implementation"
}

output "cloudfront_domain" {
  value       = "PLACEHOLDER.cloudfront.net"
  description = "HUMAN_NEEDED HN-003+/HN-005: real distribution + DNS"
}
