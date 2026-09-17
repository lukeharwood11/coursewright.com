# Tier values — production
# From infra/terraform: terraform plan|apply -var-file=../tfvars/production.tfvars
# ACM cert must be ISSUED in us-east-1 for coursewright.com
# (covers apex + *.coursewright.com). Route53 aliases are always created.

environment = "production"
domain_name = "coursewright.com"
aws_region  = "us-east-1"

# Existing Supabase project — settings/apikeys target this ref (no project create).
supabase_project_ref = "hlecttkgrfhtzvwnxtyb"
