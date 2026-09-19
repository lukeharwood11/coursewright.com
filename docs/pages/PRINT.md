# PRINT

**Generated PDF preview** of a material, a unit packet, or this week’s work. Not an “export” product — vocabulary is always **Print** (plus **Download** for the `.pdf` on this screen).

**URL (material, course, top-level):** `/my/<org-slug>/courses/<course_id>/materials/<material_id>/print`  
**URL (material, course, in unit):** `/my/<org-slug>/courses/<course_id>/units/<unit_id>/materials/<material_id>/print`  
**URL (unit, course):** `/my/<org-slug>/courses/<course_id>/units/<unit_id>/print`  
**URL (this week):** `/my/<org-slug>/print-this-week` (optional `?students=<id>,<id>` for active students on the parent home)  
**URL (material / unit, template, P1):** same `/print` suffix on the template URL tree  
**URL map:** [URLS.md](../URLS.md)

## Audience

Anyone who can already **view** that material, unit, or parent “this week” surface — instructors/editors and enrolled parents. Create → print does **not** require a roster.

## Purpose

One composition: **generate a PDF** of the grain, **preview that PDF** in the page (exact pages the user will get), then **Download** or **Print**. No format wizard. No stored print job.

## Behavior

- Auth + RLS same as the source view (parents only print **published** materials). Unauthorized → usual app gate / not found.
- **No app chrome** (no org sidebar, nav, badges-as-chrome, edit controls).
- On load: build a PDF client-side from the grain’s content; show a **loading** state while generating; then embed the **actual PDF** in an in-app viewer (iframe / PDF viewer — what you see is the file).
- Sticky action bar: **Download** (`.pdf` blob), **Print** (print that PDF via browser/system), **Back** to the source page.
- **Never** label the product surface Export / Generate PDF as the primary nav action — entry points stay **Print** / **Print unit** / **Print this week**.
- Empty: unit with no materials, or week with no dated / important-now items — plain language + back.
- Generation should feel fast for a single material; large unit / week packets may need a brief wait — still no format picker.

### By grain

| Grain | PDF content |
|-------|-------------|
| **Material** | One material by kind — **page:** blocks in order (quizzes print on the whole page: **parents** see questions only; **staff** see the answer key from block data; multiple-choice choices use drawn checkbox squares, not bracket text); **link:** title + URL/QR; **file:** if the attached file is already a PDF/image, prefer previewing **that file**; otherwise a cover sheet (title, description). Video blocks → title + URL/QR, not a player frame. No quiz-block-only print in P0. |
| **Unit** | Materials in `position` order as one packet; page breaks **between** materials. |
| **This week** | Current Sunday–Saturday dated materials (+ important now, if any) for **active** students on parent home, grouped like [ORG_HOME](./ORG_HOME.md) (e.g. by student/course). Page breaks between materials. Optional `?students=` filters the packet. |

**Not on this page:** print whole course (out of scope).

## Data shown

- In-app **PDF viewer** showing the generated (or attached) PDF pages
- Action bar: Download · Print · Back
- Loading / error states for generation failures (plain language + retry + back)

## Contents

- Full-bleed (or near full-bleed) PDF preview region
- Screen-only action bar above or beside the viewer
- Loading state while the PDF is built

## Primary actions

- **Download** — save the `.pdf`
- **Print** — print the generated PDF (system dialog / share sheet)
- **Back** — return to material, unit, or org home

## Links to

- [MATERIAL](./MATERIAL.md) — Back from material print; source of **Print**
- [UNIT](./UNIT.md) — Back from unit print; source of **Print unit**
- [ORG_HOME](./ORG_HOME.md) — Back from this-week print; source of **Print this week**
- [COURSE](./COURSE.md) — context when linked from course builder print entry points
- **P1:** template tree uses the same `/print` suffix under [TEMPLATE](./TEMPLATE.md) / [UNIT](./UNIT.md) / [MATERIAL](./MATERIAL.md)

No org chrome on this screen.

## Notes

[FEATURES.md](../FEATURES.md) — extreme shareability; print grain; **client-generated PDF + in-app preview**; no Export product name; no `PrintJob` table. [SCHEMA.md](../database/SCHEMA.md) — print is not a stored entity. Implementation: `src/print/` (`@react-pdf/renderer` document + pdf-lib for original PDF files; iframe preview of the generated blob; Download / Print that file). **P1** can deepen branding beyond the P0 ink layout.
