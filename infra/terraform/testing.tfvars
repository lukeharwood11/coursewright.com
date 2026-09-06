# Example tier values — testing
# Usage: terraform plan|apply -var-file=testing.tfvars
# HUMAN_NEEDED HN-005 — confirm DNS host / Route53 zone before wiring aliases.

environment = "testing"
domain_name = "justtesting.coursewright.com"
aws_region  = "us-east-1"
