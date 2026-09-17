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
  description = "Parent Supabase project ref (existing project hlecttkgrfhtzvwnxtyb)."
  default     = "hlecttkgrfhtzvwnxtyb"
}

variable "supabase_organization_id" {
  type        = string
  description = "Supabase organization slug (dashboard Organization Settings)."
  default     = "jzgrllkftuncbqggrmkz"
}

variable "supabase_project_name" {
  type        = string
  description = "Display name of the existing Supabase project (for import)."
  default     = "coursewright.com"
}

variable "supabase_region" {
  type        = string
  description = "Region of the existing Supabase project."
  default     = "us-east-1"
}

variable "supabase_db_password" {
  type        = string
  sensitive   = true
  default     = ""
  description = "DB password for supabase_project (production import only). Set TF_VAR_supabase_db_password. Ignored after import via lifecycle."
}
