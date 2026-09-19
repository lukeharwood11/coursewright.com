import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { writeLegalStaticPages } from "./prerender-legal-html.ts";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  isIndexablePublicHost,
  publicSeoPages,
} from "../src/marketing/model/publicSeo.ts";

function resolveHost(mode: string, envHost: string | undefined): string {
  const trimmed = envHost?.trim();
  if (trimmed) {
    return trimmed.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
  return mode === "production" ? "coursewright.com" : "beta.coursewright.com";
}

function buildRobotsTxt(host: string): string {
  if (!isIndexablePublicHost(host)) {
    return ["User-agent: *", "Disallow: /", ""].join("\n");
  }

  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /my/",
    "Disallow: /invite/",
    "Disallow: /logos",
    "",
    `Sitemap: ${absoluteUrl(host, "/sitemap.xml")}`,
    "",
  ].join("\n");
}

function buildSitemapXml(host: string): string {
  const urls = publicSeoPages
    .map((page) => {
      const loc = absoluteUrl(host, page.path);
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        `    <changefreq>${page.changefreq}</changefreq>`,
        `    <priority>${page.priority.toFixed(1)}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}

function writeSeoFiles(outDir: string, host: string): void {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "robots.txt"), buildRobotsTxt(host), "utf8");
  if (isIndexablePublicHost(host)) {
    writeFileSync(join(outDir, "sitemap.xml"), buildSitemapXml(host), "utf8");
  }
}

/**
 * Emits robots.txt + sitemap.xml for the public host, prerenders legal HTML
 * (`privacy` / `terms` / `cookies`) for non-JS crawlers, and serves discovery
 * files in dev. Production apex is indexable; beta and other hosts are fully
 * disallowed.
 */
export function seoPublicAssets(): Plugin {
  let outDir = "dist";
  let host = "coursewright.com";

  return {
    name: "coursewright-seo-public-assets",
    configResolved(config) {
      outDir = config.build.outDir;
      host = resolveHost(config.mode, config.env.VITE_PUBLIC_HOST);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (url === "/robots.txt") {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(buildRobotsTxt(host));
          return;
        }
        if (url === "/sitemap.xml" && isIndexablePublicHost(host)) {
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
          res.end(buildSitemapXml(host));
          return;
        }
        next();
      });
    },
    transformIndexHtml(html) {
      const origin = `https://${host}`;
      const canonical = absoluteUrl(host, "/");
      const ogImage = absoluteUrl(host, "/logo-course-wright.png");
      const robots = isIndexablePublicHost(host) ? "index, follow" : "noindex, nofollow";
      const jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            name: SITE_NAME,
            url: origin,
            email: "hi@coursewright.com",
            logo: absoluteUrl(host, "/logo-course-wright.png"),
          },
          {
            "@type": "WebSite",
            name: SITE_NAME,
            url: origin,
            description: SITE_DESCRIPTION,
            publisher: { "@type": "Organization", name: SITE_NAME },
          },
        ],
      });

      return html
        .replaceAll("__CW_SITE_ORIGIN__", origin)
        .replaceAll("__CW_CANONICAL_URL__", canonical)
        .replaceAll("__CW_OG_IMAGE__", ogImage)
        .replaceAll("__CW_ROBOTS__", robots)
        .replaceAll("__CW_SITE_DESCRIPTION__", SITE_DESCRIPTION)
        .replaceAll("__CW_JSON_LD__", jsonLd);
    },
    closeBundle() {
      writeSeoFiles(outDir, host);
      writeLegalStaticPages(outDir, host);
    },
  };
}
