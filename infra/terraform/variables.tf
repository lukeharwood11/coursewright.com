variable "environment" {
  type        = string
  description = "Tier name: testing | production"
}

variable "domain_name" {
  type        = string
  description = "Public hostname for this SPA tier (HN-005 DNS)"
}

variable "aws_region" {
  type        = string
  description = "AWS region (ACM for CloudFront is typically us-east-1)"
  default     = "us-east-1"
}

variable "manage_dns" {
  type        = bool
  description = "When true, spa_site creates Route53 A/AAAA aliases. Default false until HN-005."
  default     = false
}

variable "route53_zone_name" {
  type        = string
  description = "Parent Route53 hosted zone for manage_dns (coursewright.com for both tiers)"
  default     = "coursewright.com"
}

variable "acm_certificate_domain" {
  type        = string
  default     = null
  description = "Optional ACM lookup domain if it differs from domain_name (e.g. wildcard *.coursewright.com). HN-005."
}
