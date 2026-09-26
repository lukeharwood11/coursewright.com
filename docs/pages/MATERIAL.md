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
- Students: read + print + play media for **published** materials; unpublished is not listed and not openable (RLS); no builder chrome; account required (P0). Staff **Student view** matches that presentation (quizzes show questions only). When the material **accepts submissions**, a linked parent turns in one or more files for an enrolled student.
- **Accept submissions** (edit): off by default. When on, the teacher chooses allowed file groups (at least one), how many submissions a student may make (1–10, default 2), and whether submissions are allowed past the due time (on by default).
- **Gradable** (edit, only while accepting submissions): off by default. On enables **Possible points** (default 10, fractions such as 4.5 allowed) and the saved grade counts in the course gradebook. Off disables points; the teacher saves feedback only, and the submission stays out of the gradebook.
- A submission is one turn-in: one or more files, one timestamp, labeled **"<Parent name> on behalf of <child name>"** (or the student name when they submit themselves). The family and the teacher both see every submission in a **right side panel** on the material view (allowed file kinds listed there). There is no separate submissions URL. Submitted files offer **Download**; **Open** appears only when the browser can render the file (PDF, photo, audio, video, plain text) and shows it in a fullscreen view portal.
- View URL is the material path without `/edit`; edit appends `/edit`.
- Print → [PRINT](./PRINT.md) (`…/print`) → generated PDF in-app preview → Download / Print; no export wizard.
- Instance content promote to template is **P1** (opt-in); overridden copies do not receive template sync for that resource.
- File replace keeps prior blobs (versioning); audio uses a shared custom in-app player (play/pause, scrub, time, 1×/1.5×); video uses native `<video>`. Instructors can record a microphone clip (under 5 minutes) when adding or replacing a file material, or when inserting **Audio** on a page (same recorder UI in a popup → in-page file attachment).
- **file** materials always offer **Download** (signed URL with attachment disposition). **PDF** materials are a compact file card with **Preview** (fullscreen) — no inline preview by default. Images still show an inline preview with **Expand**. Audio plays inline; parents can keep reading a **page** material while an in-page audio attachment plays.

## Data shown

**Placement**

- **Title** (all kinds)
- **Description** (all kinds)
- Optional **due_date** (+ time for submission cutoff)
- Optional **scheduled_date** — UI **Focus Day** / **Focus Day (School)** / **Focus Day (Home)** from org calendar; drives This week
- Optional **due time** (`due_at` + timezone). Default 11:59 PM when a due date is saved. Shown with the timezone abbreviation. This week still uses the calendar day.
- **Accept submissions**, allowed file groups, submissions allowed, allow past due date
- **Important now** flag
- Course + unit context (names) for orientation (**P1:** or template)

**Body (by kind)**

- **page:** ordered **blocks** rendered from the Lexical document (rich text, tables, links, in-page files including **audio**, video embeds, **quizzes**)
- **link:** URL (+ title)
- **file:** attached File (name, type, **Download**; PDF → compact card + **Preview** fullscreen; image → inline preview + **Expand**; custom **audio player** when the file is audio)

**Derived / chrome**

- Print and Share controls
- Version history entry (who/when) — **Version history** dialog on edit: browse versions, preview, restore

## Contents

### Placement metadata

- **Title** — every material (**required**)
- **Description** — every material (field always present; may be empty)
- Course context; optional **unit** name when nested (omit when top-level)
- Kind badge: page / link / file
- **Visibility** — unpublished: amber badge + warning banner; published: green Published badge (staff). Unpublish at bottom of page/edit
- Optional `due_date` (+ time; default **11:59 PM** in the saver’s timezone when a due date is set)
- Optional `scheduled_date` — **Due date** is the primary field; **Add focus day** opens the This week day. Field title becomes **Focus Day (School)** or **Focus Day (Home)** when the date matches the org calendar. Wins over unit dates for This week; required for top-level materials without a unit to appear in This week
- **Accept submissions** — allowed files, submissions allowed, allow submissions past due date
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

Word-like layout (same condensed chrome as resource / quiz edit): compact header; page editor fills most of the viewport.

- **Edit URL:** `…/materials/<material_id>/edit` (locked — [URLS.md](../URLS.md))
- No “Edit …” page title. One header row: back, editable **title** beside it, quiet **Add description** / **Edit description** (small dialog), **Save** / **Cancel** (reads **Close** when unchanged); on desktop also **Save & close** (primary; saves then returns to the material view). **Cmd/Ctrl+S** saves when there are changes. Below the `md` breakpoint those actions collapse into a header **⋯** menu. Leaving the title field, pressing **Enter**, or leaving the editor (back / Close / Cancel) saves the title on its own.
- Description via the header button (not an always-visible field).
- Link URL when kind is link (slim field under the header).
- Assignment / due dates and **Accept submissions** settings sit below the content (page editor / file / link note).
- **page:** Lexical editor fills most of the viewport (same chrome as resource document edit). A version is stored only when the instructor saves and something changed — not per keystroke.
- **link / file:** edit URL or replace file (file replace → new FileVersion)
- **Version history** sits in the page editor toolbar (labeled on desktop; **⋯** on small screens). Link/file materials expose it in the edit header instead. The dialog lists each version with change type, **who saved**, and when; browse with preview; **Restore this version** confirms before applying.
- Soft deletes only
- **P1:** Instance vs template: promote opt-in; overrides block template sync for that resource

## Primary actions

- Print
- Share link
- **Download** (file materials)
- **Preview** (PDF — fullscreen) / **Expand** (image)
- Play audio (custom player) / video (native)
- **Edit** → `…/edit` (editors); on edit: compact header with **Save**, **Cancel**/**Close**, (desktop) **Save & close**, and description dialog; title saves on blur
- Toggle important now
- **Accept submissions** (and allowed files, submissions allowed, past-due rule)
- **Publish / unpublish**
- **Version history** (edit — browse / preview / restore)

## Parent variant

- Immediate clarity; print obvious; no builder chrome; phone-usable
- When the material accepts submissions: a **Submit** side panel on the right lists allowed file kinds and lets the family **Submit** (several files at once, upload icon). After a submission, the line **"<Parent name> on behalf of <child name>"** (or just the student name when they submit themselves) and the local date and time. **Submit another version** while submissions remain. When **allow submissions past due** is off, show time left under Submit; once the due instant passes, hide Submit and say submission is closed.

## Staff submissions

- On the material view, course managers see a **Submissions** side panel on the right (with allowed file kinds when accept submissions is on): each active student, or **Not submitted**, and every version with the same attribution line, timestamp, and files. Students who already submitted stay listed after they leave the course. File rows: **Open** (in-app portal when the type is viewable) and **Download**; no Open for types the browser cannot render (e.g. Word, HEIC).
- Staff also see a **Grading** list (waiting, then saved). **Grade next** opens one student’s files, points when the material is gradable, and feedback. **Save and next** stores that grade and opens the next waiting submission. Families see the saved points or feedback on their Submit panel.

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
