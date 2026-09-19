import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OG_IMAGE_PATH,
  absoluteUrl,
  documentTitleForSeoPage,
  isIndexablePublicHost,
  type PublicSeoPage,
} from "./publicSeo";

function publicHost(): string {
  const fromEnv = (import.meta.env.VITE_PUBLIC_HOST as string | undefined)?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : "coursewright.com";
}

function upsertMeta(
  attr: "name" | "property",
  key: string,
  content: string,
): void {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/** Apply title, description, canonical, and Open Graph tags for a public page. */
export function applyPublicDocumentMeta(page: PublicSeoPage | undefined): void {
  const host = publicHost();
  const title = page ? documentTitleForSeoPage(page) : SITE_NAME;
  const description = page?.description ?? SITE_DESCRIPTION;
  const path = page?.path ?? "/";
  const url = absoluteUrl(host, path);
  const image = absoluteUrl(host, SITE_OG_IMAGE_PATH);
  const indexable = isIndexablePublicHost(host);

  document.title = title;
  upsertMeta("name", "description", description);
  upsertMeta("name", "robots", indexable ? "index, follow" : "noindex, nofollow");
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:site_name", SITE_NAME);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:image", image);
  upsertMeta("name", "twitter:card", "summary");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", image);
  upsertLink("canonical", url);
}

/** Mark signed-in / auth entry screens as non-indexable. */
export function applyNoIndexDocumentMeta(title: string): void {
  document.title = title;
  upsertMeta("name", "robots", "noindex, nofollow");
}
