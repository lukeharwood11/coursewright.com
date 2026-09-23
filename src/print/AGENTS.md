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
- Page quizzes print on the whole page: staff Teacher-view packets include the answer key; parent packets (and staff **Parent view**) are questions only. A **course quiz** print uses the same checkbox drawing for multiple choice and short answer. Number, matching, and long answer print as text lines. The answer key is included for Teacher view, and for a parent when the quiz shares the key. A student login never gets that key. Multiple-choice choices use drawn SVG checkbox squares (Helvetica-safe), not Unicode bullets or `[ ]`/`[X]` text.
This-week packets print **one student at a time** (page break before the next student). For each student, **published lesson plans** (week note + day notes) print first, then that student’s important-now and dated this-week materials, packed onto a page when they fit, with a rule between them.
- If `kind = file` and the blob is already PDF, preview that file. JPEG/PNG files are placed on a generated page.
- No `PrintJob` table — generate on the fly.
- Entry points: parent home, course, unit, material, Resources item — labels **Print** / **Print unit** / **Print this week**.

## Rules

- Super easy — one tap from **Print** / **Print unit** / **Print this week**; no format wizard.
- Never name routes or entry UI **Export** / `/export`.
- Create → print works with **empty roster**.
- Whole-course print is **out of scope** for initial release.

## Don’t

- Rely on HTML `@media print` + `window.print()` as the **primary** P0 path (PDF generation + viewer is the product).
- Call entry points Export / Generate PDF.
- Use `?print=1` instead of dedicated `/print` routes.
- Persist generated PDFs in P0.
- Require students or parent invites before print works.
