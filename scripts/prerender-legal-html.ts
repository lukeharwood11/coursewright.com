import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  cookieIntro,
  cookieLastUpdated,
  cookieSections,
} from "../src/marketing/model/cookiePolicy.ts";
import {
  privacyIntro,
  privacyLastUpdated,
  privacySections,
} from "../src/marketing/model/privacyPolicy.ts";
import {
  SITE_NAME,
  SITE_OG_IMAGE_PATH,
  absoluteUrl,
  documentTitleForSeoPage,
  isIndexablePublicHost,
  publicSeoPageForPath,
} from "../src/marketing/model/publicSeo.ts";
import {
  termsIntro,
  termsLastUpdated,
  termsSections,
} from "../src/marketing/model/termsOfUse.ts";

export type LegalPageSlug = "privacy" | "terms" | "cookies";

/** S3 object keys (no extension) so CloudFront serves `/privacy` without a rewrite. */
export const LEGAL_STATIC_PAGE_SLUGS: LegalPageSlug[] = [
  "privacy",
  "terms",
  "cookies",
];

type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalPageSpec = {
  slug: LegalPageSlug;
  heading: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function legalPageSpec(slug: LegalPageSlug, host: string): LegalPageSpec {
  switch (slug) {
    case "privacy":
      return {
        slug,
        heading: "Privacy policy",
        lastUpdated: privacyLastUpdated,
        intro: privacyIntro(host),
        sections: privacySections(host),
      };
    case "terms":
      return {
        slug,
        heading: "Terms of use",
        lastUpdated: termsLastUpdated,
        intro: termsIntro(host),
        sections: termsSections(host),
      };
    case "cookies":
      return {
        slug,
        heading: "Cookie policy",
        lastUpdated: cookieLastUpdated,
        intro: cookieIntro(host),
        sections: cookieSections(host),
      };
  }
}

function renderSections(sections: LegalSection[]): string {
  const nav = sections
    .map(
      (section) =>
        `<li><a href="#${escapeHtml(section.id)}">${escapeHtml(section.title)}</a></li>`,
    )
    .join("\n");

  const body = sections
    .map((section) => {
      const paragraphs = section.paragraphs
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join("\n");
      const bullets = section.bullets
        ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n")}</ul>`
        : "";
      return `<section id="${escapeHtml(section.id)}">
  <h2>${escapeHtml(section.title)}</h2>
  ${paragraphs}
  ${bullets}
</section>`;
    })
    .join("\n");

  return `<nav aria-label="On this page">
  <p class="cw-kicker">On this page</p>
  <ul>
${nav}
  </ul>
</nav>
${body}`;
}

function extractBuiltAssets(indexHtml: string): { styles: string; scripts: string } {
  const styles = [...indexHtml.matchAll(/<link\s+rel="stylesheet"[^>]*>/gi)]
    .map((match) => match[0])
    .join("\n    ");
  const scripts = [
    ...indexHtml.matchAll(/<script\s+type="module"[^>]*><\/script>/gi),
    ...indexHtml.matchAll(/<link\s+rel="modulepreload"[^>]*>/gi),
  ]
    .map((match) => match[0])
    .join("\n    ");
  return { styles, scripts };
}

function buildLegalDocument(slug: LegalPageSlug, host: string, indexHtml: string): string {
  const page = legalPageSpec(slug, host);
  const seo = publicSeoPageForPath(`/${slug}`);
  const title = seo ? documentTitleForSeoPage(seo) : `${page.heading} · ${SITE_NAME}`;
  const description = seo?.description ?? page.intro;
  const canonical = absoluteUrl(host, `/${slug}`);
  const ogImage = absoluteUrl(host, SITE_OG_IMAGE_PATH);
  const robots = isIndexablePublicHost(host) ? "index, follow" : "noindex, nofollow";
  const { styles, scripts } = extractBuiltAssets(indexHtml);

  const alsoSee =
    slug === "privacy"
      ? `See also our <a href="/terms">terms of use</a> and <a href="/cookies">cookie policy</a>.`
      : slug === "terms"
        ? `See also our <a href="/privacy">privacy policy</a> and <a href="/cookies">cookie policy</a>.`
        : `See also our <a href="/privacy">privacy policy</a> and <a href="/terms">terms of use</a>.`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="${robots}" />
    <meta name="theme-color" content="#33604D" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    ${styles}
    <style>
      .cw-legal-shell { min-height: 100vh; display: flex; flex-direction: column; background: #f7f5ee; color: #202b23; font-family: Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .cw-legal-header, .cw-legal-footer { border-bottom: 1px solid #dedacb; background: #fff; }
      .cw-legal-footer { border-bottom: 0; border-top: 1px solid #dedacb; margin-top: auto; }
      .cw-legal-header__inner, .cw-legal-footer__inner, .cw-legal-main { margin: 0 auto; max-width: 48rem; padding: 1rem 1.25rem; }
      .cw-legal-header a, .cw-legal-footer a { color: #33604d; font-weight: 700; text-decoration: none; }
      .cw-legal-header a:hover, .cw-legal-footer a:hover { color: #234739; }
      .cw-wordmark { font-family: Lora, Georgia, serif; font-size: 1.125rem; font-weight: 600; color: #33604d; }
      .cw-legal-main { padding-top: 3rem; padding-bottom: 3rem; }
      .cw-kicker { font-size: 0.8125rem; font-weight: 700; color: #8b9186; margin: 0; }
      .cw-legal-main h1 { font-family: Lora, Georgia, serif; font-size: 1.75rem; font-weight: 600; margin: 0.25rem 0 0; color: #202b23; }
      .cw-legal-main h2 { font-family: Lora, Georgia, serif; font-size: 1.375rem; font-weight: 600; margin: 0 0 0.75rem; color: #202b23; }
      .cw-meta { font-size: 0.84375rem; color: #8b9186; margin: 0.5rem 0 0; }
      .cw-legal-main > p, .cw-legal-main section p { font-size: 0.90625rem; line-height: 1.6; color: #5b6459; margin: 0.75rem 0 0; }
      .cw-legal-main nav { margin-top: 2rem; }
      .cw-legal-main nav ul { list-style: none; padding: 0; margin: 0.5rem 0 0; }
      .cw-legal-main nav a { font-size: 0.84375rem; font-weight: 700; color: #5b6459; }
      .cw-legal-main nav a:hover { color: #33604d; }
      .cw-legal-main section { margin-top: 2.5rem; scroll-margin-top: 2rem; }
      .cw-legal-main ul { margin: 0.75rem 0 0; padding-left: 1.25rem; color: #5b6459; font-size: 0.90625rem; line-height: 1.6; }
      .cw-legal-main li + li { margin-top: 0.5rem; }
      .cw-also { margin-top: 3rem; font-size: 0.875rem; line-height: 1.6; color: #5b6459; }
      .cw-legal-footer__inner { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; font-size: 0.8125rem; }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="cw-legal-shell">
        <header class="cw-legal-header">
          <div class="cw-legal-header__inner">
            <a class="cw-wordmark" href="/">${escapeHtml(SITE_NAME)}</a>
          </div>
        </header>
        <main class="cw-legal-main">
          <p class="cw-kicker">Legal</p>
          <h1>${escapeHtml(page.heading)}</h1>
          <p class="cw-meta">Last updated ${escapeHtml(page.lastUpdated)}</p>
          <p>${escapeHtml(page.intro)}</p>
          ${renderSections(page.sections)}
          <p class="cw-also">${alsoSee}</p>
        </main>
        <footer class="cw-legal-footer">
          <div class="cw-legal-footer__inner">
            <a href="/">Home</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms of use</a>
            <a href="/cookies">Cookie policy</a>
            <a href="/contact">Contact</a>
          </div>
        </footer>
      </div>
    </div>
    ${scripts}
  </body>
</html>
`;
}

/**
 * Write extensionless HTML documents into `outDir` so S3 keys match `/privacy`,
 * `/terms`, and `/cookies`. Content comes from the same marketing model as the React pages.
 */
export function writeLegalStaticPages(outDir: string, host: string): void {
  const indexHtml = readFileSync(join(outDir, "index.html"), "utf8");
  for (const slug of LEGAL_STATIC_PAGE_SLUGS) {
    writeFileSync(join(outDir, slug), buildLegalDocument(slug, host, indexHtml), "utf8");
  }
}
