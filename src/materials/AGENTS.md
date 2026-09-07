# AGENTS — `src/materials/`

Lesson materials: **page** / **link** / **file**, plus ordered **blocks** on pages. May belong to a **unit** or sit at **course top level**.

## Scope

- Material placement (title, **description**, kind, optional `unit_id`, dates, **visibility**, important now, sync/override)
- **v1 Add material:** `page` · `link` · `file` (into a unit or top-level)
- **page** → ordered **blocks** (`rich_text`, `video`, …)
- **link** → `url`; **file** → `file_id` (org File + versions)
- Soft delete, versions, revert UX
- Dating: optional material `scheduled_date`; optional unit range only when `unit_id` is set
- **Visibility:** `unpublished` (instructors/admins) vs `published` (enrolled parents). New materials start unpublished. RLS enforces this — do not rely on UI hiding alone.

## Rules

- `unit_id` is **nullable** — null = top-level on the course (shown above units).
- Do **not** invent quiz/form schema beyond FEATURES — quiz is **not** in the v1 Add material menu.
- Page content lives in `blocks` rows — do not dump the whole page into `materials.body`.
- Generous file types/sizes for `kind = file` — keep open.
- Versioning + soft deletes are P0 — never hard-delete user content from the app.
- Replacing a file must create a `FileVersion` + new Storage blob; revert restores a prior blob.
- Print a material → `print/` domain, don’t fork print CSS here.
- **Templates are P1** — P0 authoring is on courses; course-from-course copies materials **and** blocks (share `file_id`, no blob clone).

## Don’t

- Require a unit to create a material.
- Build a separate org-wide file drive in P0.
- Skip Print control on material rows.
- Version files as metadata-only — blobs must be retained for revert.
- Ship quiz/audio as v1 Add material kinds unless FEATURES changes.
- Ship template promote/sync UI in P0.
