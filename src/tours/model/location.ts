/** First `/my/:orgSlug` segment, ignoring account routes that share the prefix. */
const ACCOUNT_SEGMENTS = new Set(["settings", "feedback"]);

export function orgSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/my\/([^/]+)/);
  if (!match) return null;
  const segment = decodeURIComponent(match[1] ?? "");
  if (!segment || ACCOUNT_SEGMENTS.has(segment)) return null;
  return segment;
}

export function courseIdFromPath(pathname: string, orgSlug: string): number | null {
  const escaped = orgSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = pathname.match(new RegExp(`^/my/${escaped}/courses/(\\d+)(?:/|$)`));
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) ? id : null;
}

export function isLessonPlanDetailPath(pathname: string): boolean {
  return /^\/my\/[^/]+\/courses\/\d+\/lesson-plans\/\d+$/.test(pathname);
}

/** True when pathname and search params match `route` exactly. */
export function locationMatches(
  current: { pathname: string; search: string },
  route: string,
): boolean {
  const url = new URL(route, "https://coursewright.local");
  if (url.pathname !== current.pathname) return false;
  const want = url.searchParams;
  const have = new URLSearchParams(current.search);
  const wantKeys = [...want.keys()];
  const haveKeys = [...have.keys()];
  if (wantKeys.length !== haveKeys.length) return false;
  for (const key of wantKeys) {
    if (have.get(key) !== want.get(key)) return false;
  }
  return true;
}
