const RESERVED_SLUGS = new Set(["settings", "login", "signup", "my"]);

/** Normalize permalink text while the user is typing (keeps trailing hyphens). */
export function formatSlugInput(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

/** Match `private.slugify` in supabase/migrations — use on save, not each keystroke. */
export function slugify(input: string): string {
  return formatSlugInput(input.trim()).replace(/^-+|-+$/g, "");
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 60;
}
