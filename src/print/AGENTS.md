# AGENTS — `src/print/`

One-tap print: material, unit, this week. **Client-generated PDF** with in-app preview.

## Scope

- Print routes (no app chrome) — [docs/URLS.md](../../docs/URLS.md), [docs/pages/PRINT.md](../../docs/pages/PRINT.md)
  - `…/materials/<id>/print`
  - `…/units/<id>/print`
  - `/my/<org-slug>/print-this-week`
  - `…/units/<unit_id>/quizzes/<quiz_id>/print`
  - `…/resources/items/<id>/print`
- Build a PDF from material / unit / this-week data; show it in a **PDF viewer**
- Actions: **Download** (`.pdf`), **Print** (that PDF), **Back**
- Ink-friendly layout (white / black) — [STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md)

## Implementation

- **`@react-pdf/renderer`**: ink layout (page / link / cover / images / QR). **`pdf-lib`**: pass through or append original PDF files in a packet.
- Preview is the generated (or attached) PDF in an iframe. **Download** saves that blob; **Print** prints that iframe.
- Page quizzes on **materials** always print as worksheets (no answer key). **Course quizzes** on print-this-week, print unit, and `/quizzes/…/print` support worksheet / answer key / both when `canShowAnswerKey` (`quizKey`, `qid` URL params). Checkbox drawing matches page quizzes. A student login never gets the course-quiz key. Multiple-choice choices use drawn SVG checkbox squares (Helvetica-safe), not Unicode bullets or `[ ]`/`[X]` text. Standalone quiz PDFs keep `quizKeyMode` (and the keyed questions) so the key page is not a worksheet. The worksheet stacks Name and Date in the upper right; the key does not. The course name sits under the quiz title. Matching prints a prompt and a drawn arrow; the key fills the answer after the arrow in the key style. Long-answer blanks are full-width rules.
- This-week packets print **one student at a time** (page break before the next student). For each student, **published lesson plans** (week note + day notes) print first, then that student’s important-now and dated this-week materials, packed onto a page when they fit, with a rule between them.
- If `kind = file` and the blob is already PDF, preview that file. JPEG/PNG files are placed on a generated page.
- No `PrintJob` table — generate on the fly.
- Entry points: student home, course, unit, material, Resources item — labels **Print** / **Print unit** / **Print this week**.

## Rules

- Super easy — one tap from **Print** / **Print unit** / **Print this week** (defaults = full week). **This week** print route has a **What to print** sidebar + layout toggles; choices persist in query params (`omit`, `break`, `pack`, `studentBreaks`, `qid`). Quiz and unit print use `quizKey` / `qid` for course-quiz worksheet vs key.
- Never name routes or entry UI **Export** / `/export`.
- Create → print works with **empty roster**.
- Whole-course print is **out of scope** for initial release.

## Don’t

- Rely on HTML `@media print` + `window.print()` as the **primary** P0 path (PDF generation + viewer is the product).
- Call entry points Export / Generate PDF.
- Use `?print=1` instead of dedicated `/print` routes.
- Persist generated PDFs in P0.
- Require students or parent invites before print works.
