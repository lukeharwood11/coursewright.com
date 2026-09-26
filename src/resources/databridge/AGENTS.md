# AGENTS — `src/resources/databridge/`

PostgREST + Storage for `org_resource_folders`, `org_resource_items`, `org_resource_blocks`, `org_resource_grants`, `org_resource_versions`. Saves use `save_resource_page` RPC when available. File blobs go through `materials/databridge/files` and `infrastructure/supabase/storage`. Soft-archive only.
