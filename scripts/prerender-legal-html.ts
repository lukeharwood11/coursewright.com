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
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OG_IMAGE_PATH,
  SITE_TAGLINE,
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

/** S3 object keys (no extension) so CloudFront serves real HTML instead of Soft-404 → index.html. */
export const EXTENSIONLESS_HTML_SLUGS = [
  "privacy",
  "terms",
  "cookies",
  "about",
  "pricing",
  "contact",
  "login",
  "signup",
] as const;

export type LegalPageSlug = "privacy" | "terms" | "cookies";

/** @deprecated Prefer EXTENSIONLESS_HTML_SLUGS — kept for legal-only callers. */
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
 * Write extensionless HTML into `outDir` for public routes Google (and other
 * non-JS crawlers) hit. Critical: `/login` must NOT Soft-404 to the same bytes
 * as `/`, or OAuth branding marks the homepage as “behind a login page.”
 */
export function writeLegalStaticPages(outDir: string, host: string): void {
  const indexHtml = readFileSync(join(outDir, "index.html"), "utf8");
  for (const slug of LEGAL_STATIC_PAGE_SLUGS) {
    writeFileSync(join(outDir, slug), buildLegalDocument(slug, host, indexHtml), "utf8");
  }
  writeFileSync(join(outDir, "about"), buildAboutDocument(host, indexHtml), "utf8");
  writeFileSync(join(outDir, "pricing"), buildPricingDocument(host, indexHtml), "utf8");
  writeFileSync(join(outDir, "contact"), buildContactDocument(host, indexHtml), "utf8");
  writeFileSync(join(outDir, "login"), buildAuthDocument("login", host, indexHtml), "utf8");
  writeFileSync(join(outDir, "signup"), buildAuthDocument("signup", host, indexHtml), "utf8");
  writeFileSync(join(outDir, "index.html"), buildHomeDocument(host, indexHtml), "utf8");
}

function shellChrome(
  host: string,
  indexHtml: string,
  opts: {
    path: string;
    title: string;
    description: string;
    robots: string;
    body: string;
  },
): string {
  const canonical = absoluteUrl(host, opts.path);
  const ogImage = absoluteUrl(host, SITE_OG_IMAGE_PATH);
  const { styles, scripts } = extractBuiltAssets(indexHtml);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(opts.title)}</title>
    <meta name="description" content="${escapeHtml(opts.description)}" />
    <meta name="robots" content="${opts.robots}" />
    <meta name="theme-color" content="#33604D" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:title" content="${escapeHtml(opts.title)}" />
    <meta property="og:description" content="${escapeHtml(opts.description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
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
      .cw-static-shell { min-height: 100vh; display: flex; flex-direction: column; background: #f7f5ee; color: #202b23; font-family: Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .cw-static-header, .cw-static-footer { border-bottom: 1px solid #dedacb; background: #fff; }
      .cw-static-footer { border-bottom: 0; border-top: 1px solid #dedacb; margin-top: auto; }
      .cw-static-header__inner, .cw-static-footer__inner, .cw-static-main { margin: 0 auto; max-width: 48rem; padding: 1rem 1.25rem; }
      .cw-static-header a, .cw-static-footer a, .cw-static-main a { color: #33604d; font-weight: 700; text-decoration: none; }
      .cw-wordmark { font-family: Lora, Georgia, serif; font-size: 1.125rem; font-weight: 600; color: #33604d; }
      .cw-static-main { padding-top: 3rem; padding-bottom: 3rem; }
      .cw-static-main h1 { font-family: Lora, Georgia, serif; font-size: 1.75rem; font-weight: 600; margin: 0.25rem 0 0; color: #202b23; }
      .cw-static-main h2 { font-family: Lora, Georgia, serif; font-size: 1.25rem; font-weight: 600; margin: 2rem 0 0.75rem; color: #202b23; }
      .cw-kicker { font-size: 0.8125rem; font-weight: 700; color: #8b9186; margin: 0; }
      .cw-static-main p, .cw-static-main li { font-size: 0.95rem; line-height: 1.6; color: #5b6459; margin: 0.75rem 0 0; }
      .cw-static-main ul { margin: 0.75rem 0 0; padding-left: 1.25rem; }
      .cw-static-nav, .cw-static-footer__inner, .cw-static-cta { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; }
      .cw-static-cta { margin-top: 1.5rem; }
      .cw-auth-card { margin-top: 1.5rem; max-width: 22rem; border: 1px solid #dedacb; border-radius: 10px; background: #fff; padding: 1.25rem; }
      .cw-auth-card label { display: block; font-size: 0.8125rem; font-weight: 700; color: #5b6459; margin-top: 0.75rem; }
      .cw-auth-card input { display: block; width: 100%; margin-top: 0.35rem; box-sizing: border-box; border: 1px solid #dedacb; border-radius: 6px; padding: 0.6rem 0.75rem; font: inherit; }
      .cw-auth-card button { margin-top: 1rem; width: 100%; border: 0; border-radius: 6px; background: #33604d; color: #fff; font-weight: 700; padding: 0.7rem 1rem; cursor: pointer; }
    </style>
  </head>
  <body>
    <div id="root">
${opts.body}
    </div>
    ${scripts}
  </body>
</html>
`;
}

function buildAboutDocument(host: string, indexHtml: string): string {
  const robots = isIndexablePublicHost(host) ? "index, follow" : "noindex, nofollow";
  const body = `      <div class="cw-static-shell">
        <header class="cw-static-header">
          <div class="cw-static-header__inner cw-static-nav">
            <a class="cw-wordmark" href="/">${escapeHtml(SITE_NAME)}</a>
            <a href="/">Home</a>
            <a href="/pricing">Pricing</a>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms of use</a>
          </div>
        </header>
        <main class="cw-static-main">
          <p class="cw-kicker">About</p>
          <h1>For homeschool co-ops and micro-schools</h1>
          <p>
            Course Wright is a public web application at https://${escapeHtml(host)}.
            You can read about the product on this page without signing in.
          </p>
          <p>
            Course Wright gives you one place to plan courses, share materials with
            parents, and run your program. It is meant to feel obvious — especially
            for families opening a link on a phone.
          </p>
          <h2>Who it is for</h2>
          <ul>
            <li><strong>Admins</strong> — run the organization: people, roles, and the shape of your program.</li>
            <li><strong>Instructors</strong> — plan courses, copy what worked last term, and share or print materials.</li>
            <li><strong>Parents</strong> — see this week’s work and print what you need, without complicated software.</li>
          </ul>
          <h2>What you can do</h2>
          <ul>
            <li>Plan courses and group work into units</li>
            <li>Copy a course so you aren’t starting from a blank page each term</li>
            <li>Share materials with parents — including print</li>
            <li>Run the org with clear admin, instructor, and parent roles</li>
            <li>Sign in with email or Google when you are ready to use the product</li>
          </ul>
          <div class="cw-static-cta">
            <a href="/">Back to home</a>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms of use</a>
            <a href="/signup">Sign up</a>
          </div>
        </main>
        <footer class="cw-static-footer">
          <div class="cw-static-footer__inner">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms of use</a>
            <a href="/contact">Contact</a>
          </div>
        </footer>
      </div>`;
  return shellChrome(host, indexHtml, {
    path: "/about",
    title: `About · ${SITE_NAME}`,
    description:
      "Who Course Wright is for — homeschool co-ops and micro-schools that need one simple hub for courses, materials, and parents.",
    robots,
    body,
  });
}

function buildPricingDocument(host: string, indexHtml: string): string {
  const robots = isIndexablePublicHost(host) ? "index, follow" : "noindex, nofollow";
  const body = `      <div class="cw-static-shell">
        <header class="cw-static-header">
          <div class="cw-static-header__inner cw-static-nav">
            <a class="cw-wordmark" href="/">${escapeHtml(SITE_NAME)}</a>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/privacy">Privacy policy</a>
          </div>
        </header>
        <main class="cw-static-main">
          <p class="cw-kicker">Pricing</p>
          <h1>Free (for now)</h1>
          <p>
            Course Wright might change its pricing in the future, but right now we’re
            working with a handful of small organizations to polish the product.
            There are no plans or dollar amounts to publish yet.
          </p>
          <p>
            This pricing information is public — you do not need to sign in to read it.
          </p>
          <div class="cw-static-cta">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/privacy">Privacy policy</a>
            <a href="/signup">Sign up</a>
          </div>
        </main>
        <footer class="cw-static-footer">
          <div class="cw-static-footer__inner">
            <a href="/">Home</a>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms of use</a>
          </div>
        </footer>
      </div>`;
  return shellChrome(host, indexHtml, {
    path: "/pricing",
    title: `Pricing · ${SITE_NAME}`,
    description:
      "Course Wright is free for now. Create an organization and invite your co-op or micro-school — pricing may change later.",
    robots,
    body,
  });
}

function buildContactDocument(host: string, indexHtml: string): string {
  const robots = isIndexablePublicHost(host) ? "index, follow" : "noindex, nofollow";
  const body = `      <div class="cw-static-shell">
        <header class="cw-static-header">
          <div class="cw-static-header__inner cw-static-nav">
            <a class="cw-wordmark" href="/">${escapeHtml(SITE_NAME)}</a>
            <a href="/">Home</a>
            <a href="/privacy">Privacy policy</a>
          </div>
        </header>
        <main class="cw-static-main">
          <p class="cw-kicker">Contact</p>
          <h1>Contact Course Wright</h1>
          <p>You can reach us without signing in:</p>
          <ul>
            <li><strong>hi@coursewright.com</strong> — partnerships and product questions</li>
            <li><strong>support@coursewright.com</strong> — help using Course Wright</li>
            <li><strong>legal@coursewright.com</strong> — privacy and legal questions</li>
          </ul>
          <div class="cw-static-cta">
            <a href="/">Home</a>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms of use</a>
          </div>
        </main>
        <footer class="cw-static-footer">
          <div class="cw-static-footer__inner">
            <a href="/">Home</a>
            <a href="/privacy">Privacy policy</a>
          </div>
        </footer>
      </div>`;
  return shellChrome(host, indexHtml, {
    path: "/contact",
    title: `Contact · ${SITE_NAME}`,
    description:
      "Contact Course Wright — partnership and product questions at hi@coursewright.com, support at support@coursewright.com.",
    robots,
    body,
  });
}

function buildAuthDocument(
  kind: "login" | "signup",
  host: string,
  indexHtml: string,
): string {
  const isLogin = kind === "login";
  const title = isLogin ? `Sign in · ${SITE_NAME}` : `Sign up · ${SITE_NAME}`;
  const heading = isLogin ? "Welcome back" : "Create an account";
  const submit = isLogin ? "Sign in" : "Create account";
  const swap = isLogin
    ? `New here? <a href="/signup">Sign up</a>`
    : `Already have an account? <a href="/login">Sign in</a>`;
  const body = `      <div class="cw-static-shell">
        <header class="cw-static-header">
          <div class="cw-static-header__inner cw-static-nav">
            <a class="cw-wordmark" href="/">${escapeHtml(SITE_NAME)}</a>
            <a href="/">Home (no login required)</a>
            <a href="/about">About</a>
            <a href="/privacy">Privacy policy</a>
          </div>
        </header>
        <main class="cw-static-main">
          <p class="cw-kicker">Account</p>
          <h1>${escapeHtml(heading)}</h1>
          <p>
            This is the Course Wright ${isLogin ? "sign-in" : "sign-up"} page.
            Product information is on the <a href="/">home page</a> and
            <a href="/about">about page</a> — those pages do not require a login.
          </p>
          <div class="cw-auth-card">
            <p><strong>${escapeHtml(submit)} to Course Wright</strong></p>
            <label>Email <input type="email" name="email" autocomplete="username" /></label>
            <label>Password <input type="password" name="password" autocomplete="${isLogin ? "current-password" : "new-password"}" /></label>
            <button type="button">${escapeHtml(submit)}</button>
            <p style="margin-top:0.75rem;font-size:0.8125rem">${swap}</p>
          </div>
          <p>
            By continuing you agree to our
            <a href="/terms">terms of use</a> and
            <a href="/privacy">privacy policy</a>.
          </p>
        </main>
        <footer class="cw-static-footer">
          <div class="cw-static-footer__inner">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms of use</a>
          </div>
        </footer>
      </div>`;
  return shellChrome(host, indexHtml, {
    path: `/${kind}`,
    title,
    description: isLogin
      ? "Sign in to Course Wright. Product information is available on the public home and about pages without logging in."
      : "Create a Course Wright account. You can read about the product on the public home and about pages without logging in.",
    robots: "noindex, nofollow",
    body,
  });
}

function buildHomeDocument(host: string, indexHtml: string): string {
  const seo = publicSeoPageForPath("/");
  const title = seo ? documentTitleForSeoPage(seo) : SITE_NAME;
  const description = seo?.description ?? SITE_DESCRIPTION;
  const canonical = absoluteUrl(host, "/");
  const ogImage = absoluteUrl(host, SITE_OG_IMAGE_PATH);
  const robots = isIndexablePublicHost(host) ? "index, follow" : "noindex, nofollow";
  const { styles, scripts } = extractBuiltAssets(indexHtml);

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
    <link rel="manifest" href="/site.webmanifest" />
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
      .cw-home-shell { min-height: 100vh; display: flex; flex-direction: column; background: #f7f5ee; color: #202b23; font-family: Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .cw-home-header, .cw-home-footer { border-bottom: 1px solid #dedacb; background: #fff; }
      .cw-home-footer { border-bottom: 0; border-top: 1px solid #dedacb; margin-top: auto; }
      .cw-home-header__inner, .cw-home-footer__inner, .cw-home-main { margin: 0 auto; max-width: 48rem; padding: 1rem 1.25rem; }
      .cw-home-header a, .cw-home-footer a, .cw-home-main a { color: #33604d; font-weight: 700; text-decoration: none; }
      .cw-home-header a:hover, .cw-home-footer a:hover, .cw-home-main a:hover { color: #234739; }
      .cw-wordmark { font-family: Lora, Georgia, serif; font-size: 1.5rem; font-weight: 600; color: #33604d; }
      .cw-home-main { padding-top: 3rem; padding-bottom: 3rem; }
      .cw-home-main h1 { font-family: Lora, Georgia, serif; font-size: 1.75rem; font-weight: 600; margin: 0.75rem 0 0; color: #33604d; }
      .cw-home-main h2 { font-family: Lora, Georgia, serif; font-size: 1.25rem; font-weight: 600; margin: 2rem 0 0.75rem; color: #202b23; }
      .cw-home-main p { font-size: 0.95rem; line-height: 1.6; color: #5b6459; margin: 0.75rem 0 0; max-width: 36rem; }
      .cw-home-cta { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; margin-top: 1.5rem; }
      .cw-home-footer__inner { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; font-size: 0.8125rem; }
      .cw-home-nav { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; font-size: 0.875rem; }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="cw-home-shell">
        <header class="cw-home-header">
          <div class="cw-home-header__inner cw-home-nav">
            <a class="cw-wordmark" href="/">${escapeHtml(SITE_NAME)}</a>
            <a href="/about">About</a>
            <a href="/pricing">Pricing</a>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms of use</a>
            <a href="/signup">Sign up</a>
            <a href="/login">Sign in</a>
          </div>
        </header>
        <main class="cw-home-main">
          <p class="cw-wordmark">${escapeHtml(SITE_NAME)}</p>
          <h1>${escapeHtml(SITE_TAGLINE)}</h1>
          <p>${escapeHtml(SITE_DESCRIPTION)}</p>
          <p>
            <strong>You do not need to sign in to read this page.</strong>
            Course Wright’s public home page explains the product for visitors.
            Sign-in is only required to use the app after you create an account.
          </p>
          <p>
            Course Wright helps homeschool co-ops and micro-schools plan courses,
            share materials with parents, and print what they need — without the
            clunky complexity of typical school software. Sign up to create an
            organization, invite staff and parents, and run your program from one place.
          </p>
          <div class="cw-home-cta">
            <a href="/signup">Sign up</a>
            <a href="/about">See how it works</a>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms of use</a>
          </div>
          <h2>Why Course Wright?</h2>
          <p><strong>Ease of use.</strong> Built so parents and volunteers can understand it quickly.</p>
          <p><strong>Built for small organizations.</strong> Made for co-ops and micro-schools.</p>
          <p><strong>One place for materials.</strong> Courses, files, and parent sharing in one app.</p>
          <p><strong>Paper when you need it.</strong> Print a material, a unit, or this week in one tap.</p>
          <h2>Legal</h2>
          <p>
            Please read our
            <a href="/privacy">Privacy policy</a>
            (including how we handle Google user data for Sign in with Google) and our
            <a href="/terms">Terms of use</a>.
          </p>
        </main>
        <footer class="cw-home-footer">
          <div class="cw-home-footer__inner">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/pricing">Pricing</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms of use</a>
            <a href="/cookies">Cookie policy</a>
            <a href="/docs">Help</a>
          </div>
        </footer>
      </div>
    </div>
    ${scripts}
  </body>
</html>
`;
}
