# AGENTS — `src/marketing/`

Public marketing site: home, about, pricing, contact, privacy, cookies, help docs, and footer placeholders.

## Scope

- Unauthenticated sales and trust pages (`/`, `/about`, `/pricing`, `/contact`, `/privacy`, `/cookies`, `/docs` and nested help topics)
- Shared marketing chrome (header / footer + copyright)
- Construction placeholder for unfinished footer URLs (`/terms`)

## Rules

- Static copy only — no org, course, or roster data.
- Voice and vocabulary from [BRANDING.md](../../docs/BRANDING.md); look from [STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md).
- Match [pages/HOME.md](../../docs/pages/HOME.md), [ABOUT](../../docs/pages/ABOUT.md), [PRICING](../../docs/pages/PRICING.md), [CONTACT](../../docs/pages/CONTACT.md), [PRIVACY](../../docs/pages/PRIVACY.md), [COOKIES](../../docs/pages/COOKIES.md), [DOCS](../../docs/pages/DOCS.md), [CONSTRUCTION](../../docs/pages/CONSTRUCTION.md).
- Help copy lives in `model/helpDocs.ts`; screens live in `docs/` — keep role descriptions aligned with [FEATURES.md](../../docs/FEATURES.md) RBAC.
- Do not invent dollar amounts. Pricing is **invite-only pilot** — no plan cards or packaging options. Pilot partnership interest → `hi@coursewright.com`.
- Public emails live in `model/contactEmails.ts` (`hi@`, `support@`, `legal@`). Contact page directory lists **hi** and **support** only; advertise **`legal@` only on privacy / cookie legal pages**.
- Privacy copy: `model/privacyPolicy.ts`. Cookie copy: `model/cookiePolicy.ts`. Host from `VITE_PUBLIC_HOST`; keep PostHog / provider disclosures aligned with [STACK.md](../../docs/STACK.md). Do not mention other deploy tiers in policy bodies.
- Do not invent remaining legal copy — unfinished footer pages share [CONSTRUCTION](../../docs/pages/CONSTRUCTION.md).
- Keep footer links in `model/footerNav.ts` so the footer and construction routes stay in sync (`ready: false` → ConstructionPage). Header and footer both link to `/docs` as **Help**.
- Primary CTA → `/signup`. Sign in → `/login`. When signed in, marketing header shows **My Account** → `/my` instead of Sign in / Sign up.
- Public copy stays general. Do **not** name specific third-party tools (WhatsApp, Outlook, SharePoint, Google Classroom, etc.) — that patchwork is internal inspiration, not site copy. Naming infrastructure providers on legal pages (Supabase, AWS, PostHog, Google sign-in) is intentional.

## Don’t

- Put signed-in `/my` chrome here.
- Use LMS jargon, pictorial logo marks, or “Export” language.
- Claim PostHog session replay (or other practices) until STACK / product docs say they are on.
