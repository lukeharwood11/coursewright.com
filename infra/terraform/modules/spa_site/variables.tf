variable "environment" {
  type        = string
  description = "Tier name: testing | production"
}

variable "domain_name" {
  type        = string
  description = "Public hostname for this SPA (CloudFront alias). HN-005."
}

variable "manage_dns" {
  type        = bool
  description = "When true, create Route53 A/AAAA aliases for domain_name in route53_zone_name. Default false until HN-005."
  default     = false
}

variable "route53_zone_name" {
  type        = string
  description = "Parent Route53 hosted zone (coursewright.com for both apex and justtesting subdomain). Used only when manage_dns is true."
  default     = "coursewright.com"
}

variable "acm_certificate_domain" {
  type        = string
  default     = null
  description = "Domain to look up an ISSUED ACM cert in us-east-1. Null = var.domain_name. Set to a wildcard (e.g. *.coursewright.com) if that is what was issued (HN-005)."
}
