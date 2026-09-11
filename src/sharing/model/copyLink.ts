export function resourceShareMessage(visibility?: "published" | "unpublished"): string {
  if (visibility === "unpublished") {
    return "Link copied. Families can’t open this until you publish it.";
  }
  return "Link copied. They’ll need to sign in to open it.";
}
