# Tier values — testing
# From infra/terraform: terraform plan|apply -var-file=../tfvars/testing.tfvars
# HUMAN_NEEDED HN-005 — ACM cert must be ISSUED in us-east-1 for coursewright.com
# (covers apex + *.coursewright.com). Route53 aliases are always created.

environment = "testing"
domain_name = "justtesting.coursewright.com"
aws_region  = "us-east-1"
