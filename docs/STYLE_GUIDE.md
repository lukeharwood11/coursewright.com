# Course Wright — Style Guide

Visual system parsed from the brand concept. **Product, marketing, and UI work should follow this file.**

Positioning, audience, and taglines live in [BRANDING.md](./BRANDING.md).

**Logo for now:** type only — **Course Wright** (full) and **CW** (short). No carpenter’s square / ruler mark.

---

## Logo

| Lockup | Treatment | Use |
|--------|-----------|-----|
| **Wordmark** | `Course Wright` in **Lora** 600 | Hero, login, brand sheet |
| **Short** | `CW` in **Lora** 600 | Nav, favicon-scale, tight headers |

Do not invent a pictorial mark until we revisit. Do not use a carpenter’s square, ruler, or letter-as-tool glyph.

Wordmark color: **Wright Green** (`#33604D`) on paper, or **Paper** (`#F7F5EE`) on green/ink.

Login header: wordmark at ~17px Lora 600, centered, with optional small **CW** beside it if space is tight.

---

## Color

Named as on the brand sheet. Use CSS variables below.

| Name | Token | Hex | Role |
|------|-------|-----|------|
| Wright Green | `--green` | `#33604D` | Primary, brand, primary buttons, active tab |
| Green deep | `--green-deep` | `#234739` | Primary hover, text on green tint |
| Green tint | `--green-tint` | `#E6EDE7` | Soft fills, unit numbers, focus ring wash |
| Amber | `--amber` | `#D98A3D` | Sparing accent — CTAs that need urgency, solid “Important now” badge |
| Amber deep | `--amber-deep` | `#B96F27` | Important-now title, due dates |
| Amber tint | `--amber-tint` | `#F7E7D0` | Important now card background |
| Slate | `--slate` | `#4C7691` | Info, “In sync”, avatars (secondary) |
| Slate tint | `--slate-tint` | `#E4EDF1` | Slate badges |
| Paper | `--paper` | `#F7F5EE` | Page / canvas background |
| Surface | `--surface` | `#FFFFFF` | Cards, top bars, inputs |
| Ink | `--ink` | `#202B23` | Primary text |
| Ink soft | `--ink-soft` | `#5B6459` | Subcopy, labels |
| Ink faint | `--ink-faint` | `#8B9186` | Meta, placeholders, inactive nav |
| Line | `--line` | `#DEDACB` | Borders, input stroke |
| Line soft | `--line-soft` | `#EAE7DB` | Hairline dividers, device chrome |
| Proto gray | — | `#ECE9DE` | Concept-page surround only — **not** product chrome |

Amber is **sparing** for product chrome (Important now, due dates). Green does the work. Slate means “system/info,” not a second brand color.

**Course calendar colors** are a separate small palette used only to tell courses apart on This week / Calendar (chips, legend, week-note bars). They are not brand colors and must stay muted on `--paper`.

| Key | Token | Hex | Role |
|-----|-------|-----|------|
| moss | `--course-moss` | `#33604D` | Default / Wright Green |
| slate | `--course-slate` | `#4C7691` | |
| clay | `--course-clay` | `#A56B4C` | |
| plum | `--course-plum` | `#6B5478` | |
| sea | `--course-sea` | `#3D7A7A` | |
| wine | `--course-wine` | `#8B4A56` | |
| sand | `--course-sand` | `#9A7B3C` | |
| pine | `--course-pine` | `#2F5D50` | |

### CSS variables

```css
:root {
  --paper: #F7F5EE;
  --surface: #FFFFFF;
  --ink: #202B23;
  --ink-soft: #5B6459;
  --ink-faint: #8B9186;
  --line: #DEDACB;
  --line-soft: #EAE7DB;
  --green: #33604D;
  --green-deep: #234739;
  --green-tint: #E6EDE7;
  --amber: #D98A3D;
  --amber-deep: #B96F27;
  --amber-tint: #F7E7D0;
  --slate: #4C7691;
  --slate-tint: #E4EDF1;
  --course-moss: #33604D;
  --course-slate: #4C7691;
  --course-clay: #A56B4C;
  --course-plum: #6B5478;
  --course-sea: #3D7A7A;
  --course-wine: #8B4A56;
  --course-sand: #9A7B3C;
  --course-pine: #2F5D50;
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 18px;
  --shadow: 0 2px 10px rgba(32, 43, 35, 0.08), 0 1px 2px rgba(32, 43, 35, 0.06);
  --font-display: "Lora", Georgia, serif;
  --font-ui: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

Google Fonts: `Lora` 500/600/700 · `Manrope` 400/500/600/700/800.

---

## Type

| Role | Face | Weight | Size (concept) | Notes |
|------|------|--------|----------------|-------|
| Wordmark | Lora | 600 | 17–40px | Headings family only |
| Page title | Lora | 600 | 24–26px desktop, ~21px parent greeting | e.g. course name, “This week's materials” |
| Login heading | Lora | 600 | 24px | “Welcome back” |
| UI subhead | Manrope | 800 | 15–15.5px | Student name, course name in cards |
| Body | Manrope | 400–600 | 13.5–14.5px | Product copy |
| Label | Manrope | 700 | 12.5–13px | Field labels, sidebar `h4` |
| Meta / badge | Manrope | 700–800 | 11.5–12px | Badges, due dates |
| Tab bar | Manrope | 700 | 11.5px | Parent phone footer |

**Lora is never body UI.** Course titles and greetings may use Lora; lists, buttons, badges, and nav use Manrope.

Sentence case everywhere. No tracked-out eyebrows. Section labels (e.g. “Palette”, “Type”) are Manrope 700, faint ink — not uppercase with letter-spacing.

### Line height

Body ~1.45–1.6. Headings ~1.3.

---

## Shape, line, motion

| Token | Value |
|-------|-------|
| Radius small | `6px` — buttons, inputs |
| Radius medium | `10px` — cards, units, badges sit on 999px pills |
| Radius large | `18px` — device/frame only in prototypes |
| Shadow | `--shadow` — **one** light elevation; no stacked multi-layer shadows |
| Borders | `1px solid var(--line)` or `--line-soft` |
| Focus | `2px solid var(--green)`, offset 2px; inputs also `0 0 0 3px var(--green-tint)` |
| Reduced motion | Honor `prefers-reduced-motion: reduce` — no transitions |
| Page loading | Shared `PageLoading` — animated **CW** mark + optional “what’s loading” label |

Prefer **borders and dividers** over shadows for structure. Cards: white surface + soft line, not floating dark chrome.

---

## Icons

**Heroicons** via `@heroicons/react` (MIT — [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)).

| Rule | Choice |
|------|--------|
| Default | **24px outline** (`@heroicons/react/24/outline`) for chrome, lists, actions |
| Emphasis | **24px solid** when a filled state is clearer (active tab, selected) |
| Size | Match nearby text; typically `h-5 w-5` (20px) or `h-6 w-6` (24px) |
| Color | Inherit `currentColor` — set color on the parent (ink / green / faint), don’t hardcode hex on the SVG |
| Stroke | Use the set as shipped; don’t invent a second icon library |

Import per icon so the bundle stays tree-shaken:

```tsx
import { PrinterIcon } from "@heroicons/react/24/outline";
```

---

## Components

### Buttons

| Class | Look | Use |
|-------|------|-----|
| **Primary** | Green fill, white text, 700, 11–12px padding | Main action (“Continue”, “Add material”) |
| **Secondary** | White, `1px` line, 700 | “Share with parents”, “Print”, “View” on important card |
| **Ghost** | Dashed line, left-aligned, full width | “Add material to this unit” |
| **Google** | White, line border, icon + “Sign in with Google” | Login only |

Primary hover → `--green-deep`. Secondary hover → green border + green tint fill. Google hover → light ink shadow.

### Badges

Pill (`border-radius: 999px`), 12px, weight 700.

| Variant | Colors | Meaning |
|---------|--------|---------|
| Green | tint + `--green-deep` | Active |
| Amber | tint + `--amber-deep` | Overridden |
| Amber solid | `--amber` + white | Important now (on a material row) |
| Slate | tint + `--slate` | Status chips; (**P1:** In sync, “From template: …”) |
| Neutral | `--line-soft` + `--ink-soft` | Grade, term, student count |

Use badges instead of “dot · joined · metadata” strings.

### Inputs

White, `1px var(--line)`, radius `--r-sm`, 11px 13px padding, 14.5px Manrope. Focus: green border + green-tint ring. Labels above, left-aligned, 13px 700 ink-soft.

### Cards

Surface + `--line-soft` border + `--r-md`. Course cards and units share this language.

### Important now

Amber-tint panel, **4px left bar** in amber, `--r-md`. Title “Important now” in amber-deep, 12px 800. Body 14px. Secondary button on white.

### Avatars

Circle, 26–30px, green/slate/amber fills, white initials, 700.

### Units (instructor)

Numbered circle (green tint / green deep). Unit name Manrope 800. Optional dates 12px faint. Chevron rotates when open. **Print unit** on the unit header. Materials: icon + name + badge + **Print**. Hairline between rows.

**Top-level materials** (no unit) sit **above** the units list on the course — same material row language, not inside a unit accordion.

---

## Layout patterns (from concept screens)

### Login (phone)

Paper canvas. Centered card, max-width ~320px. Wordmark → Lora heading → one-line subcopy → Google → “or” divider → email → Continue. Footer: “New to Course Wright? Ask your co-op admin for an invite.”

### Parent dashboard (phone — usability anchor)

1. Top bar: **CW** or tiny wordmark + **org name** (700) + avatar + **Activity bell**. On desktop, a simpler collapsible sidebar (This week, Calendar, Announcements, Discussions, their courses, Progress) sits beside the page. Content uses the remaining width — do not center a narrow column on large screens.
2. Greeting (Lora) + week range (“Week of Sep 1 – Sep 7”, Sunday–Saturday) + **Print this week**
3. **Student tags** when more than one child — tap to include or hide that student’s work
4. Two columns on large screens: **this week’s calendar** | **Focus** (**Important now** + **Coming up** — Assigned next / Due next). Course-colored week notes sit above the grid. Stacks on small screens (calendar first).
5. Week calendar cells show lesson-plan text, then a divider, then materials. **Assigned** chips are outlined in the course color; **Due** chips are filled. A course legend filters classes.
6. Bottom tabs on phone: **This week** | **Progress** (Progress may be P1 — dim/inactive until then). On desktop, those destinations live in the sidebar instead (plus **Calendar**).

Keep parent chrome minimal. One job on the home tab.

### Instructor / owner / admin (desktop)

Collapsible **sidebar** for org navigation: Home, Calendar, Announcements, Discussions, Courses (nested course names), Roster, Families (nested family names), Settings. Collapse to icons; on small screens it becomes an overlay drawer. (**P1:** Templates in nav.) **Activity** is a header bell to the right of the avatar, not a sidebar tab.

Top bar: search (staff) + account menu + Activity bell. Content uses the remaining width — do not center a narrow column on large screens.

Course builder body: Lora course title + badge row + **Print** / Share / Add material.  
Two columns on the course page: **units** | page sidebar (instructors, roster). (**P1:** linked template in sidebar.)
Hide the persistent org sidebar under ~768px (hamburger opens it).

### Print (P0)

Print builds a **real PDF** and previews that file on dedicated `/print` (and `print-this-week`) routes — see [PRINT](./pages/PRINT.md). Layout rules apply to the **PDF content**, not an HTML print stylesheet as the primary path.

| Rule | Treatment |
|------|-----------|
| Page | White. Black ink. No `--paper` beige fill (wastes toner) |
| Chrome | No nav/tabs in the PDF. Screen action bar: **Download** / **Print** / **Back** around the PDF viewer |
| Title | Lora 600 — course name, then unit, then material title |
| Body | Manrope, ~12–13pt equivalent, ink, generous line-height |
| Files | If the material is already a PDF/image, preview that file; otherwise generate a cover / packet PDF |
| Header (small) | Course Wright wordmark + course title — once, faint, not a branded poster |
| Page breaks | Controlled in the PDF layout. **Unit:** break between materials. **This week:** break between students; pack a student’s materials onto a page when they fit (rule between assignments); start the next assignment on a new page if it can’t begin cleanly |

**Print** is a secondary button in the product; on parent “this week” it can sit beside the week range. Label is always **Print**, **Print unit**, or **Print this week** — never Export. On the print screen itself, **Download** is allowed for the `.pdf`.

Invoking print navigates to the print route, generates the PDF, and shows it in an in-app viewer.

---

## Voice in UI

Clear, warm, plain-spoken. Explain; don’t impress. No LMS jargon.

Examples from concept:

- “Sign in to see your courses and materials.”
- “Create a course from this one to reuse materials next term.”
- “Add material to this unit”
- “Print this week”

Not: “LMS”, “modules”, “assignments dashboard”, “sync payload”, “Export packet”, “Generate PDF”.

---

## Do / don’t

**Do**

- Sentence case  
- Badges for status  
- Manrope in the product chrome  
- Green for primary; amber only for due / important / override  
- Type-only logo: Course Wright / CW  
- Heroicons (outline by default) for UI glyphs  
- **Print** in the open, next to Share — never in an overflow menu  

**Don’t**

- Carpenter’s square, ruler, or tool illustration as the mark  
- Lora in buttons, tables, or form labels  
- Purple, terracotta-on-cream, or Inter/Roboto as brand type  
- A second icon set mixed with Heroicons  
- Stacked heavy shadows, glowing pills, uppercase tracked eyebrows  
- Crowding the parent home with instructor complexity
- Beige or green full-page backgrounds when printing
- “Export” or format pickers in front of Print  

---

## Prototype-only

The concept page’s **dark pill metanav**, **browser dots**, and **#ECE9DE** surround are for reviewing mockups. They are not product UI.
