# AGENTS — `public/`

Static assets copied into `dist/` by Vite (icons, logos, SEO discovery files).

## Scope

- Favicons / Apple touch icon / wordmark images
- `site.webmanifest` (PWA pt 1: `display: standalone`, start URL `/my`)
- `sw.js` (network-first navigations; cache icons)
- `llms.txt`, `.well-known/security.txt`
- Do **not** commit `robots.txt`, `sitemap.xml`, or extensionless legal HTML (`privacy` / `terms` / `cookies`) — generated at build by [`scripts/vite-seo-assets.ts`](../scripts/vite-seo-assets.ts) / [`scripts/prerender-legal-html.ts`](../scripts/prerender-legal-html.ts)

## Rules

- Prefer production-absolute URLs only in committed text files meant for crawlers (`llms.txt`, `security.txt`).
- Keep brand colors aligned with [STYLE_GUIDE.md](../docs/STYLE_GUIDE.md) (`#33604D`, `#F7F5EE`).
- [`scripts/deploy-spa.sh`](../scripts/deploy-spa.sh) uploads legal pages as S3 keys with `Content-Type: text/html` so `/privacy` is not an empty SPA shell for non-JS verifiers.
