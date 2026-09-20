export function feedbackPath(orgSlug?: string | null): string {
  if (orgSlug) return `/my/${orgSlug}/feedback`;
  return "/my/feedback";
}
