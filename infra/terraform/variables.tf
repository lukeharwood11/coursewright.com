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

variable "route53_zone_name" {
  type        = string
  description = "Parent Route53 hosted zone (coursewright.com for both tiers)"
  default     = "coursewright.com"
}

variable "acm_certificate_domain" {
  type        = string
  default     = "coursewright.com"
  description = "ACM domain to look up in us-east-1. One cert covers coursewright.com and *.coursewright.com (HN-005)."
}

# --- Supabase (Management API via SUPABASE_ACCESS_TOKEN) ---

variable "supabase_project_ref" {
  type        = string
  description = "Parent / production Supabase project ref (existing project hlecttkgrfhtzvwnxtyb). Testing branches off this; production settings target it."
  default     = "hlecttkgrfhtzvwnxtyb"
}
