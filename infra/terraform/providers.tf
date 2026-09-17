# HUMAN_NEEDED HN-003 — AWS credentials: local env / shared config, or GHA OIDC
# role arn:aws:iam::891612573605:role/github-oidc (see terraform-plan.yml / terraform-apply.yml).
# Do not commit access keys. The spa_site module is real: apply creates S3 + CloudFront.
# ACM (HN-005) is ISSUED; remaining gates: HN-003 AWS/OIDC confirm + HN-010 GitHub Environments.
#
# Supabase: provider reads SUPABASE_ACCESS_TOKEN from the environment (local or GHA secret).
# Do not hardcode access_token here.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

# Prefer us-east-1 for CloudFront + ACM certs used with CloudFront.
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      AppName     = "coursewright.com"
      Environment = var.environment
      Owner       = "Luke Harwood"
    }
  }
}

# Access token: SUPABASE_ACCESS_TOKEN env var (never commit).
provider "supabase" {}
