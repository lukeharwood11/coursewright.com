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
