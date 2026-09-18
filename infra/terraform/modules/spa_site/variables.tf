variable "environment" {
  type        = string
  description = "Tier name: testing | production"
}

variable "domain_name" {
  type        = string
  description = "Public hostname for this SPA (CloudFront alias). HN-005."
}

variable "route53_zone_name" {
  type        = string
  description = "Parent Route53 hosted zone (coursewright.com for both apex and beta subdomain)."
  default     = "coursewright.com"
}

variable "acm_certificate_domain" {
  type        = string
  default     = "coursewright.com"
  description = "Domain to look up an ISSUED ACM cert in us-east-1. One cert covers coursewright.com and *.coursewright.com (HN-005)."
}
