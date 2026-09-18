# AGENTS — `src/marketing/`

Public marketing site: home, about, pricing, and footer placeholders.

## Scope

- Unauthenticated sales and trust pages (`/`, `/about`, `/pricing`)
- Shared marketing chrome (header / footer + copyright)
- Construction placeholder for unfinished footer URLs (`/contact`, `/privacy`, `/terms`, `/cookies`)

## Rules

- Static copy only — no org, course, or roster data.
- Voice and vocabulary from [BRANDING.md](../../docs/BRANDING.md); look from [STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md).
- Match [pages/HOME.md](../../docs/pages/HOME.md), [ABOUT](../../docs/pages/ABOUT.md), [PRICING](../../docs/pages/PRICING.md), [CONSTRUCTION](../../docs/pages/CONSTRUCTION.md).
- Do not invent dollar amounts. Pricing is **invite-only pilot** — no plan cards or packaging options.
- Do not invent legal or contact copy — unfinished footer pages share [CONSTRUCTION](../../docs/pages/CONSTRUCTION.md).
- Keep footer links in `model/footerNav.ts` so the footer and construction page stay in sync.
- Primary CTA → `/signup`. Sign in → `/login`.
- Public copy stays general. Do **not** name specific third-party tools (WhatsApp, Outlook, SharePoint, Google Classroom, etc.) — that patchwork is internal inspiration, not site copy.

## Don’t

- Put signed-in `/my` chrome here.
- Use LMS jargon, pictorial logo marks, or “Export” language.
