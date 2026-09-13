# Example tier values — testing
# Usage: terraform plan|apply -var-file=testing.tfvars
# HUMAN_NEEDED HN-005 — ACM cert must be ISSUED in us-east-1 for this hostname
# (or set acm_certificate_domain to a covering wildcard). Leave manage_dns false
# until DNS host is Route53 and aliases should be created automatically.

environment = "testing"
domain_name = "justtesting.coursewright.com"
aws_region  = "us-east-1"
manage_dns  = false
