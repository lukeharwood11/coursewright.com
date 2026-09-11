# Partial backend config — production tier state key in the shared nosh/amia bucket.
# Usage: terraform init -reconfigure -backend-config=backend-production.hcl
key = "spa/production/terraform.tfstate"
