# Tier values — testing
# From infra/terraform: terraform plan|apply -var-file=../tfvars/testing.tfvars
# ACM cert must be ISSUED in us-east-1 for coursewright.com
# (covers apex + *.coursewright.com, including beta). Route53 aliases are always created.

environment = "testing"
domain_name = "beta.coursewright.com"
aws_region  = "us-east-1"

# Existing Supabase project (main). Testing uses a persistent DB branch off this parent.
supabase_project_ref      = "hlecttkgrfhtzvwnxtyb"
supabase_organization_id  = "jzgrllkftuncbqggrmkz"
supabase_project_name     = "coursewright.com"
supabase_region           = "us-east-1"
