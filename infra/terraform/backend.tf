# Remote state uses the EXISTING shared nosh/amia S3 backend.
# Do not create a CourseWright-only state bucket or DynamoDB lock table — only new keys.
#
# The S3 `key` is not var-driven; pass a partial backend config per tier:
#   terraform init -backend-config=backend-testing.hcl
#   terraform init -reconfigure -backend-config=backend-production.hcl
# Pair the matching -var-file=testing.tfvars | production.tfvars after init.
# Switching tiers requires -reconfigure so Terraform picks up the other key.

terraform {
  backend "s3" {
    bucket         = "lukeharwood-dev-tfstate"
    region         = "us-east-2"
    dynamodb_table = "lukeharwood-dev-tf-lock"
    encrypt        = true
  }
}
