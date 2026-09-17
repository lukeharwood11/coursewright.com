# Supabase via official provider (SUPABASE_ACCESS_TOKEN env).
# Production: settings + apikeys on the existing project (by ref) — do not create
# a supabase_project resource (that would require a DB password on every plan and
# could create a second project if applied without import).
# Testing: persistent DB branch off the parent project; settings + apikeys on the branch.
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
# Production — existing project by ref (no create / no import).
# ---------------------------------------------------------------------------

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

# Read keys after settings so the provider has waited for the branch project to
# be ACTIVE (supabase_settings Create waits; the branch resource does not).
data "supabase_apikeys" "testing" {
  count = local.is_testing ? 1 : 0

  project_ref = supabase_branch.testing[0].database.id

  depends_on = [supabase_settings.testing]
}

# ---------------------------------------------------------------------------
# Outputs (SPA build / deploy scripts)
# ---------------------------------------------------------------------------

output "supabase_project_ref" {
  value = local.is_testing ? (
    length(supabase_branch.testing) > 0 ? supabase_branch.testing[0].database.id : null
  ) : var.supabase_project_ref
  description = "Supabase project ref for this tier (branch ref for testing, main for production). Null on testing until the branch exists — never falls back to main."
}

output "supabase_parent_project_ref" {
  value       = var.supabase_project_ref
  description = "Parent/main Supabase project ref (hlecttkgrfhtzvwnxtyb). Used by deploy-supabase.sh / nuke.sh to refuse testing→main."
}

output "supabase_url" {
  value = local.is_testing ? (
    length(supabase_branch.testing) > 0 ? format("https://%s.supabase.co", supabase_branch.testing[0].database.id) : null
  ) : format("https://%s.supabase.co", var.supabase_project_ref)
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
