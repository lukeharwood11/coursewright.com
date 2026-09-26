# PRINT

**Generated PDF preview** of a material, a unit packet, a course quiz, this week’s work, or an org **Resource**. Not an “export” product — vocabulary is always **Print** (plus **Download** for the `.pdf` on this screen).

**URL (material, course, top-level):** `/my/<org-slug>/courses/<course_id>/materials/<material_id>/print`  
**URL (material, course, in unit):** `/my/<org-slug>/courses/<course_id>/units/<unit_id>/materials/<material_id>/print`  
**URL (quiz):** `/my/<org-slug>/courses/<course_id>/units/<unit_id>/quizzes/<quiz_id>/print`  
**URL (unit, course):** `/my/<org-slug>/courses/<course_id>/units/<unit_id>/print`  
**URL (this week):** `/my/<org-slug>/print-this-week` (optional `?students=<id>,<id>` for active students on the student home; optional `?omit=`, `?break=`, `?pack=0`, `?studentBreaks=0` — see **This week options** below)  
**URL (event):** `/my/<org-slug>/events/<event_id>/print`  
**URL (resource):** `/my/<org-slug>/resources/items/<item_id>/print`  
**URL (resources, several):** `/my/<org-slug>/resources/print?items=<id>,<id>`  
**URL (material / unit, template, P1):** same `/print` suffix on the template URL tree  
**URL map:** [URLS.md](../URLS.md)

## Audience

Anyone who can already **view** that material, unit, course quiz, parent “this week” surface, or org resource — instructors/editors and enrolled parents (resources: membership + ACL, not enrollment). Create → print does **not** require a roster.

## Purpose

One composition: **generate a PDF** of the grain, **preview that PDF** in the page (exact pages the user will get), then **Download** or **Print**. Entry from the student home stays **one tap** with everything included; **this week** also offers an on-screen options list (not a separate export product). No stored print job.

## Behavior

- Auth + RLS same as the source view (parents only print **published** materials). Unauthorized → usual app gate / not found.
- **No app chrome** (no org sidebar, nav, badges-as-chrome, edit controls).
- On load: build a PDF client-side from the grain’s content; show a **loading** state while generating; then embed the **actual PDF** in an in-app viewer (iframe / PDF viewer — what you see is the file).
- Sticky action bar: **Download** (`.pdf` blob), **Print** (print that PDF via browser/system), **Back** to the source page.
- **Never** label the product surface Export / Generate PDF as the primary nav action — entry points stay **Print** / **Print unit** / **Print this week**.
- Empty: unit with no materials, or week with no dated / important-now / lesson-plan items — plain language + back.
- Generation should feel fast for a single material; large unit / week packets may need a brief wait.
- **This week only:** a **What to print** panel beside the preview lists lesson-plan notes and linked materials, important now, assigned and due work (including course quizzes), plus layout switches (pack assignments, page break between students, per-item **Start on new page**). Course-quiz rows also offer **Worksheet**, **Answer key**, or **Both** when this person may see the key. Choices persist in the URL (`omit`, `break`, `pack`, `studentBreaks`, `qid`) so a link can be bookmarked or shared. Defaults include the full week.
- **Course quiz** (`/quizzes/…/print`) and **Print unit** when the unit has quizzes: same worksheet / answer key / both control when the viewer may see the key (`quizKey=` on a single quiz; `qid=` on unit and this week). Default when the key is allowed: **Answer key** (matches prior teacher behavior).
- **Page materials** (including page-quiz blocks inside a lesson): always print as a **worksheet** — the answer key never appears on material, unit, or this-week packets.

### By grain

| Grain | PDF content |
|-------|-------------|
| **Material** | One material by kind — **page:** blocks in order (embedded page quizzes print as worksheets only — no answer key); **link:** title + URL/QR; **file:** if the attached file is already a PDF/image, prefer previewing **that file**; otherwise a cover sheet (title, description). Video blocks → title + URL/QR, not a player frame. No quiz-block-only print in P0. |
| **Unit** | Published **materials** and **course quizzes** in shared `position` order (material wins a tie). Page breaks **between** items. Materials are worksheets only; each course quiz follows the worksheet / answer key / both choice when allowed. |
| **Quiz** | One course quiz. Worksheet, answer key, or both when this person may see the key (Teacher view, or a parent when **Share answer key with parents** is on). A student login never gets the key. The worksheet has **Name** and **Date** lines stacked in the upper right; the answer key does not. The course name sits under the quiz title. Each question is numbered in bold, with the point value in bold after the prompt. Multiple-choice choices use the same drawn checkbox squares as a page quiz; the key checks the correct ones. A number prints one blank, or the answer on the key. Matching prints each prompt with an arrow (and the mixed right column on the worksheet); the key fills the answer after the arrow. A long answer prints the number of blank lines the teacher chose, each a full-width rule, or the answer on the key. Short answer prints one blank, or the answer on the key. |
| **This week** | Current Sunday–Saturday dated materials (+ important now, if any) **and published lesson plans** for **active** students on student home, grouped like [ORG_HOME](./ORG_HOME.md) **by student**. Each student: **lesson plans first** (week note + day notes, then materials linked on that plan in day order), then remaining important-now and dated work (materials and course quizzes). One student at a time; **page break before the next student** (unless `studentBreaks=0`). Pack that student’s items onto a page when they fit (`pack=0` gives each item its own page), separated by a rule when packed; optional per-item page breaks via `break=` or the panel. Optional `?students=` filters students; `?omit=` excludes item keys from the PDF. |
| **Resource** | One org resource by type — **document:** Lexical blocks (same page layout as a page material; no quizzes in P1a); **file:** same as a file material; **link:** not printed from this screen. Several selected documents and files use `?items=` as one packet (links skipped). |
| **Event** | The event write-up (same page layout as a page material), with when, location, and linked material titles |

**Not on this page:** print whole course (out of scope).

## Data shown

- In-app **PDF viewer** showing the generated (or attached) PDF pages
- Action bar: Download · Print · Back
- **This week:** checkbox tree of printable items (by student) and layout toggles; preview refreshes when options change
- Loading / error states for generation failures (plain language + retry + back)

## Contents

- Full-bleed (or near full-bleed) PDF preview region
- **This week:** options panel (left on desktop; scrollable above preview on small screens) + preview
- Screen-only action bar above the viewer
- Loading state while the PDF is built; brief “Updating preview…” when options change

## Primary actions

- **Download** — save the `.pdf`
- **Print** — print the generated PDF (system dialog / share sheet)
- **Back** — return to the quiz, material, unit, or org home

## Links to

- [QUIZ](./QUIZ.md) — Back from a quiz print; source of **Print**
- [MATERIAL](./MATERIAL.md) — Back from material print; source of **Print**
- [UNIT](./UNIT.md) — Back from unit print; source of **Print unit**
- [ORG_HOME](./ORG_HOME.md) — Back from this-week print; source of **Print this week**
- [EVENT](./EVENT.md) — Back from an event print; source of **Print** on the event
- [RESOURCE](./RESOURCE.md) — Back from a single resource print; source of **Print** on a document or file
- [RESOURCES](./RESOURCES.md) / [RESOURCE_FOLDER](./RESOURCE_FOLDER.md) — Back from a multi-item resource print; source of **Print** on a selection
- [COURSE](./COURSE.md) — context when linked from course builder print entry points
- **P1:** template tree uses the same `/print` suffix under [TEMPLATE](./TEMPLATE.md) / [UNIT](./UNIT.md) / [MATERIAL](./MATERIAL.md)

No org chrome on this screen.

## Notes

[FEATURES.md](../FEATURES.md) — extreme shareability; print grain; **client-generated PDF + in-app preview**; no Export product name; no `PrintJob` table. [SCHEMA.md](../database/SCHEMA.md) — print is not a stored entity. Implementation: `src/print/` (`@react-pdf/renderer` document + pdf-lib for original PDF files; iframe preview of the generated blob; Download / Print that file). **P1** can deepen branding beyond the P0 ink layout.
