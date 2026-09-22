# MATERIAL

**URL (course, top-level):** `/my/<org-slug>/courses/<course_id>/materials/<material_id>`  
**URL (course, in unit):** `/my/<org-slug>/courses/<course_id>/units/<unit_id>/materials/<material_id>`  
**Edit:** append `/edit` (e.g. `…/materials/<material_id>/edit`)  
**URL (template, P1, top-level):** `/my/<org-slug>/templates/<template_id>/materials/<material_id>`  
**URL (template, P1, in unit):** `/my/<org-slug>/templates/<template_id>/units/<unit_id>/materials/<material_id>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Instructors/editors; parents viewing shared content after login.

## Purpose

View (and edit) a single material placement — the thing parents open from this week, important now, or a resource link. Print and share stay obvious.


## Behavior

- Load one material placement; RLS/role determines edit vs read.
- Instructors: edit via `…/edit`, set important now, **publish / unpublish**, share resource link, print, version/revert, soft-delete.
- **Published:** green **Published** badge (check) next to the title for staff; no “families can see this” banner. **Unpublish** sits at the bottom of the material view/edit.
- **Unpublished:** amber warning banner + Publish; unpublished badge next to title.
- Parents: read + print + play media for **published** materials; unpublished is not listed and not openable (RLS); no builder chrome; account required (P0). Staff **Parent view** matches that presentation (quizzes show questions only).
- View URL is the material path without `/edit`; edit appends `/edit`.
- Print → [PRINT](./PRINT.md) (`…/print`) → generated PDF in-app preview → Download / Print; no export wizard.
- Instance content promote to template is **P1** (opt-in); overridden copies do not receive template sync for that resource.
- File replace keeps prior blobs (versioning); audio uses a shared custom in-app player (play/pause, scrub, time, 1×/1.5×); video uses native `<video>`. Instructors can record a microphone clip (under 5 minutes) when adding or replacing a file material, or when inserting **Audio** on a page (same recorder UI in a popup → in-page file attachment).
- **file** materials always offer **Download** (signed URL with attachment disposition). **PDF** materials are a compact file card with **Preview** (fullscreen) — no inline preview by default. Images still show an inline preview with **Expand**. Audio plays inline; parents can keep reading a **page** material while an in-page audio attachment plays.

## Data shown

**Placement**

- **Title** (all kinds)
- **Description** (all kinds)
- Optional **scheduled_date** (assignment date)
- Optional **due_date**
- **Important now** flag
- Course + unit context (names) for orientation (**P1:** or template)

**Body (by kind)**

- **page:** ordered **blocks** rendered from the Lexical document (rich text, tables, links, in-page files including **audio**, video embeds, **quizzes**)
- **link:** URL (+ title)
- **file:** attached File (name, type, **Download**; PDF → compact card + **Preview** fullscreen; image → inline preview + **Expand**; custom **audio player** when the file is audio)

**Derived / chrome**

- Print and Share controls
- Version history entry (who/when) when exposed — TBD UX

## Contents

### Placement metadata

- **Title** — every material (**required**)
- **Description** — every material (field always present; may be empty)
- Course context; optional **unit** name when nested (omit when top-level)
- Kind badge: page / link / file
- **Visibility** — unpublished: amber badge + warning banner; published: green Published badge (staff). Unpublish at bottom of page/edit
- Optional `scheduled_date` (assignment date; wins over unit dates for “this week”; required for top-level materials to appear in “this week”)
- Optional `due_date` (Add due date on add/edit; display only — does not drive This week)
- Important now flag (instructor)

### Content (v1 kinds)

- **page** — Lexical editor: playground-style icon toolbar, `/` slash commands, insert popups for table size / link / video / **audio**; headings, lists, quotes, tables, links, **video** URL embeds, in-page file attachments (paste image uploads; images show as clean pictures without filename chrome; PDFs are a compact card with **Preview** fullscreen), **audio** (upload or record a clip under 5 minutes → in-page file), **quizzes** (correct answers on the block; staff see the key, parents see questions only); printable block layout
- **link** — external URL; print → title + URL/QR
- **file** — org File; versioned blobs; **Download**; PDF → compact card + **Preview**; image → preview + **Expand**; audio → shared custom player (same as in-page file attachments). On add/replace, instructors may **record a clip** (under 5 minutes) with the device microphone instead of picking a file
- Quiz author + print is a **page block** (not a separate material kind)
- Forms — **not P0**

### Share & print

- **Print** — one tap → [PRINT](./PRINT.md) (`…/materials/<id>/print`) → generated PDF preview → Download / Print (no export wizard)
- **Share** — resource link; recipient must log in (P0); lands on this material after auth

### Edit

- **Edit URL:** `…/materials/<material_id>/edit` (locked — [URLS.md](../URLS.md))
- Placement fields + page content: **Save** / **Cancel** in the page header; Save disabled when unchanged; Cancel returns to the material view (confirms if dirty)
- **page:** [Lexical](https://lexical.dev/) WYSIWYG with a playground-style **icon** toolbar (not word buttons). Headings, lists, quotes, tables, links, video URL embeds, in-page files, **audio** insert (upload or record), **quizzes** with marked correct answers. Type `/` to insert a block. Table insert asks for rows and columns. Audio insert opens the same recorder UI used on file materials. A version is stored only when the instructor saves and something changed — not per keystroke.
- **link / file:** edit URL or replace file (file replace → new FileVersion)
- Versioning / who changed what / revert dangerous actions
- Soft deletes only
- **P1:** Instance vs template: promote opt-in; overrides block template sync for that resource

## Primary actions

- Print
- Share link
- **Download** (file materials)
- **Preview** (PDF — fullscreen) / **Expand** (image)
- Play audio (custom player) / video (native)
- **Edit** → `…/edit` (editors)
- Toggle important now
- **Publish / unpublish**
- Revert version (when exposed)

## Parent variant

- Immediate clarity; print obvious; no builder chrome; phone-usable

## Links to

- [UNIT](./UNIT.md) — parent unit when nested
- [COURSE](./COURSE.md) — parent course (always; home for top-level materials)
- [ORG_HOME](./ORG_HOME.md) — parent return to this week / dashboard
- Via org chrome (instructor/admin): [COURSE_LIST](./COURSE_LIST.md), [RESOURCES](./RESOURCES.md), [ORG_ROSTER](./ORG_ROSTER.md), [ORG_SETTINGS](./ORG_SETTINGS.md), [ORG_PICKER](./ORG_PICKER.md), [ACCOUNT_SETTINGS](./ACCOUNT_SETTINGS.md); advanced search TBD
- [PRINT](./PRINT.md) — **Print** → `…/materials/<material_id>/print`
- Resource share entry — TBD (recipients land here after login)
- **P1:** [TEMPLATE](./TEMPLATE.md) — when under a template

## Notes

[FEATURES.md](../FEATURES.md) — Add material: **page / link / file**; pages = blocks. [FILE_STORAGE.md](../FILE_STORAGE.md) for files. Templates = **P1**.

**Out of scope on this page (P0):** online quiz take + autograde (P1); Forms; quiz in v1 Add **material** menu (quiz is a block on a page); **print whole course**; template promote/sync.
