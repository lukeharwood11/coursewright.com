# HUMAN_NEEDED HN-003 — configure AWS provider credentials via env / shared config.
# Do not commit access keys.

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
}
