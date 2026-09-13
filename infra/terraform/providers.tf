# HUMAN_NEEDED HN-003 — AWS credentials: local env / shared config, or GHA OIDC
# role arn:aws:iam::891612573605:role/github-oidc (see terraform-plan.yml / terraform-apply.yml).
# Do not commit access keys. The spa_site module is real: apply creates S3 + CloudFront.
# Do not apply (local or GHA terraform-apply.yml) until an ISSUED ACM cert exists in
# us-east-1 for coursewright.com + *.coursewright.com (HN-005). GitHub Environment gates: HN-010.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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
