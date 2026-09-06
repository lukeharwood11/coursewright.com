# Example tier values — production
# Usage: terraform plan|apply -var-file=production.tfvars
# HUMAN_NEEDED HN-005 — confirm DNS host / Route53 zone before wiring aliases.

environment = "production"
domain_name = "coursewright.com"
aws_region  = "us-east-1"
