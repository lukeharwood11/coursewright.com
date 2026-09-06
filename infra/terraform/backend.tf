# HUMAN_NEEDED HN-004 — configure remote state after bootstrap bucket exists.
# Uncomment and fill, then use separate state keys per tier (testing vs production).
#
# terraform {
#   backend "s3" {
#     bucket         = "REPLACE_ME_coursewright-terraform-state"
#     key            = "spa/REPLACE_TIER/terraform.tfstate"
#     region         = "us-east-1"
#     dynamodb_table = "REPLACE_ME_coursewright-terraform-locks"
#     encrypt        = true
#   }
# }

terraform {
  # Local backend until HN-004 is complete. Do not use for shared/prod without remote state.
}
