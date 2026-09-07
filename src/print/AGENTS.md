# AGENTS — `src/print/`

One-tap print: material, unit, this week. **Client-generated PDF** with in-app preview.

## Scope

- Print routes (no app chrome) — [docs/URLS.md](../../docs/URLS.md), [docs/pages/PRINT.md](../../docs/pages/PRINT.md)
  - `…/materials/<id>/print`
  - `…/units/<id>/print`
  - `/my/<org-slug>/print-this-week`
- Build a PDF from material / unit / this-week data; show it in a **PDF viewer**
- Actions: **Download** (`.pdf`), **Print** (that PDF), **Back**
- Ink-friendly layout (white / black) — [STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md)

## Implementation

- **`@react-pdf/renderer`**: ink layout (page / link / cover / images / QR). **`pdf-lib`**: pass through or append original PDF files in a packet.
- Preview is the generated (or attached) PDF in an iframe. **Download** saves that blob; **Print** prints that iframe.
- Map blocks / link / file kinds in `model/`; document tree lives in `print/components/PacketDocument.tsx`; `print/hooks/renderPrintPdf.tsx` turns it into a blob.
- If `kind = file` and the blob is already PDF, preview that file. JPEG/PNG files are placed on a generated page.
- No `PrintJob` table — generate on the fly.
- Entry points: parent home, course, unit, material — labels **Print** / **Print unit** / **Print this week**.

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
