# Remote state uses the EXISTING shared nosh/amia S3 backend.
# Do not create a CourseWright-only state bucket — only new keys.
# Locking is S3-native (`use_lockfile`); no DynamoDB lock table.
#
# Keys (partial backend configs):
#   testing/coursewright.com/terraform.tfstate  → backend-testing.hcl
#   prod/coursewright.com/terraform.tfstate     → backend-production.hcl
#
#   terraform init -backend-config=backend-testing.hcl
#   terraform init -reconfigure -backend-config=backend-production.hcl
# Pair the matching -var-file=../tfvars/testing.tfvars | ../tfvars/production.tfvars after init.
# Switching tiers requires -reconfigure so Terraform picks up the other key.

terraform {
  backend "s3" {
    bucket       = "lukeharwood-dev-tfstate"
    region       = "us-east-2"
    use_lockfile = true
    encrypt      = true
  }
}
