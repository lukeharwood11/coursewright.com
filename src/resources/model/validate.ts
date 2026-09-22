import type { ResourceItemType } from "./kinds";

export function looksLikeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateResourceTitle(title: string): string | null {
  if (!title.trim()) return "Give this a name.";
  if (title.trim().length > 300) return "That name is too long.";
  return null;
}

export function validateResourceLinkUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return "Add a web address.";
  if (!looksLikeHttpUrl(trimmed)) return "Use a web address that starts with http:// or https://.";
  return null;
}

export function validateNewResource(args: {
  type: ResourceItemType;
  title: string;
  url?: string;
}): string | null {
  const titleError = validateResourceTitle(args.title);
  if (titleError) return titleError;
  if (args.type === "link") return validateResourceLinkUrl(args.url ?? "");
  return null;
}

export function validateFolderName(name: string): string | null {
  if (!name.trim()) return "Give the folder a name.";
  if (name.trim().length > 200) return "That folder name is too long.";
  return null;
}
