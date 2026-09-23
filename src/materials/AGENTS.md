# AGENTS — `src/materials/`

Lesson materials: **page** / **link** / **file**, plus ordered **blocks** on pages. May belong to a **unit** or sit at **course top level**.

## Scope

- Material placement (title, **description**, kind, optional `unit_id`, dates, **visibility**, important now, sync/override)
- **v1 Add material:** `page` · `link` · `file` (into a unit in the UI; `unit_id` may still be null in the database)
- **page** → ordered **blocks** (`rich_text`, `video`, …); rich text is authored in [Lexical](https://lexical.dev/) and stored as editor JSON (tables, quotes, links, in-page file nodes, **quiz** nodes)
- **link** → `url`; **file** → `file_id` (org File + versions)
- Soft delete, versions, revert UX
- Dating: optional material `scheduled_date` (assignment / This week); optional `due_date` plus optional `due_at` / `due_timezone` (submission cutoff; This week still uses the calendar date); optional unit range only when `unit_id` is set
- **Submissions:** optional **Accept submissions** on a course material (allowed file groups, how many times a student may turn work in, allow past the due instant). Turn-in UI lives in `src/submissions/`.
- **Visibility:** `unpublished` (instructors/admins) vs `published` (enrolled parents). New materials start unpublished. RLS enforces this — do not rely on UI hiding alone. Published → title badge; Unpublish at bottom of material screens.

## Rules

- `unit_id` is **nullable** — null = leftover top-level on the course (shown above units). The UI adds new materials on a unit.
- Do **not** invent a quiz **material kind**. A page **quiz** node stays here for print. A course quiz families take in the app lives in `src/quizzes/`.
- Page content lives in `blocks` rows — do not dump the whole page into `materials.body`. Rich-text `body.lexical` is the Lexical editor state (including quiz nodes); keep video URLs as `video` blocks.
- Generous file types/sizes for `kind = file` — keep open.
- Versioning + soft deletes are P0 — never hard-delete user content from the app.
- Replacing a file must create a `FileVersion` + new Storage blob; revert restores a prior blob.
- Print a material → `print/` domain, don’t fork print CSS here.
- **Templates are P1** — P0 authoring is on courses; course-from-course copies materials **and** blocks (share `file_id`, no blob clone).

## Don’t

- Require a unit in the database to store a material.
- Build a separate org-wide file drive in P0.
- Skip Print control on material rows.
- Version files as metadata-only — blobs must be retained for revert.
- Ship quiz/audio as v1 Add **material** kinds unless FEATURES changes.
- Ship template promote/sync UI in P0.
