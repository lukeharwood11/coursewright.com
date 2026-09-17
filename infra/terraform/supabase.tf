# Supabase via official provider (SUPABASE_ACCESS_TOKEN env).
# Production: import existing project into this tier's state; manage settings + apikeys.
# Testing: persistent DB branch off the parent project; settings + apikeys on the branch.
#
# One-time production import:
#   terraform init -reconfigure -backend-config=backend-production.hcl
#   TF_VAR_supabase_db_password='…' terraform import -var-file=../tfvars/production.tfvars \
#     'supabase_project.main[0]' hlecttkgrfhtzvwnxtyb
#
# Migrations / Edge Functions stay CLI (scripts/deploy-supabase.sh) — not managed here.

locals {
  is_testing    = var.environment == "testing"
  is_production = var.environment == "production"

  supabase_site_url = "https://${var.domain_name}"

  supabase_auth_settings = jsonencode({
    site_url = local.supabase_site_url
    uri_allow_list = join(",", [
      "http://localhost:5173",
      "http://localhost:5173/**",
      local.supabase_site_url,
      "${local.supabase_site_url}/**",
    ])
  })

  supabase_api_settings = jsonencode({
    db_schema            = "public,storage,graphql_public"
    db_extra_search_path = "public,extensions"
    max_rows             = 1000
  })
}

# ---------------------------------------------------------------------------
# Production — import existing project (do not recreate).
# ---------------------------------------------------------------------------

resource "supabase_project" "main" {
  count = local.is_production ? 1 : 0

  organization_id   = var.supabase_organization_id
  name              = var.supabase_project_name
  database_password = var.supabase_db_password
  region            = var.supabase_region

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [database_password]
  }
}

resource "supabase_settings" "main" {
  count = local.is_production ? 1 : 0

  project_ref = var.supabase_project_ref

  api  = local.supabase_api_settings
  auth = local.supabase_auth_settings
}

data "supabase_apikeys" "main" {
  count = local.is_production ? 1 : 0

  project_ref = var.supabase_project_ref
}

# ---------------------------------------------------------------------------
# Testing — persistent branch separate from main.
# ---------------------------------------------------------------------------

resource "supabase_branch" "testing" {
  count = local.is_testing ? 1 : 0

  parent_project_ref = var.supabase_project_ref
  git_branch         = "testing"
  persistent         = true
}

resource "supabase_settings" "testing" {
  count = local.is_testing ? 1 : 0

  project_ref = supabase_branch.testing[0].database.id

  api  = local.supabase_api_settings
  auth = local.supabase_auth_settings

  depends_on = [supabase_branch.testing]
}

data "supabase_apikeys" "testing" {
  count = local.is_testing ? 1 : 0

  project_ref = supabase_branch.testing[0].database.id

  depends_on = [supabase_branch.testing]
}

# ---------------------------------------------------------------------------
# Outputs (SPA build / deploy scripts)
# ---------------------------------------------------------------------------

output "supabase_project_ref" {
  value = local.is_testing ? (
    length(supabase_branch.testing) > 0 ? supabase_branch.testing[0].database.id : var.supabase_project_ref
  ) : var.supabase_project_ref
  description = "Supabase project ref for this tier (branch ref for testing, main for production)"
}

output "supabase_url" {
  value = format(
    "https://%s.supabase.co",
    local.is_testing ? (
      length(supabase_branch.testing) > 0 ? supabase_branch.testing[0].database.id : var.supabase_project_ref
    ) : var.supabase_project_ref
  )
  description = "Supabase API URL for this tier"
}

output "supabase_anon_key" {
  value = local.is_testing ? (
    length(data.supabase_apikeys.testing) > 0 ? coalesce(data.supabase_apikeys.testing[0].publishable_key, data.supabase_apikeys.testing[0].anon_key) : ""
    ) : (
    length(data.supabase_apikeys.main) > 0 ? coalesce(data.supabase_apikeys.main[0].publishable_key, data.supabase_apikeys.main[0].anon_key) : ""
  )
  sensitive   = true
  description = "Publishable / anon key for Vite (VITE_SUPABASE_ANON_KEY)"
}

output "supabase_branch_id" {
  value       = local.is_testing && length(supabase_branch.testing) > 0 ? supabase_branch.testing[0].id : null
  description = "UUID of the persistent testing branch (null on production)"
}
