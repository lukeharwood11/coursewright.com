# AGENTS — `src/resources/`

Org-scoped **Resources**: nested folders and document / link / file items. Not course materials.

## Scope

- Browse `/my/<org-slug>/resources` and `/resources/folders/<id>`
- View / edit / print `/resources/items/<id>`
- Folder + item ACL (presets or per-person grants), publish/unpublish
- Bulk drag-drop file upload with progress

## Rules

- Tables are `org_resource_*`. Do **not** insert `materials` rows.
- Reuse Lexical page editor, org `files` / Storage, and print packet rendering.
- Access is membership + ACL — not enrollment / `parent_student_links`.
- Soft-archive via `archived_at`. Never hard-delete user content from the app.
- Page folders: `resources/` (root + folder browse), `resource/` (view), `resource-edit/` (edit). Shared `model/` + `databridge/`.

## Don’t

- Relax `materials` course⊕template XOR.
- Add Forms (P1b) or calendar attachments in this slice.
- Put Resources CRUD in `organizations/` or `materials/`.
