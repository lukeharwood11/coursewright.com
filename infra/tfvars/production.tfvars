# Tier values — production
# From infra/terraform: terraform plan|apply -var-file=../tfvars/production.tfvars
# ACM cert must be ISSUED in us-east-1 for coursewright.com
# (covers apex + *.coursewright.com). Route53 aliases are always created.

environment = "production"
domain_name = "coursewright.com"
aws_region  = "us-east-1"

# Existing Supabase project — imported into this tier's state as supabase_project.main.
# Set TF_VAR_supabase_db_password for first import / plan (ignored after import via lifecycle).
supabase_project_ref     = "hlecttkgrfhtzvwnxtyb"
supabase_organization_id = "jzgrllkftuncbqggrmkz"
supabase_project_name    = "coursewright.com"
supabase_region          = "us-east-1"
