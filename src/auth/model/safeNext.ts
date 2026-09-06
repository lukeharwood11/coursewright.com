/** Same-origin app path only — blocks open redirects after login. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value) return "/my";
  if (!value.startsWith("/")) return "/my";
  if (value.startsWith("//")) return "/my";
  if (value.startsWith("/login") || value.startsWith("/signup")) return "/my";
  return value;
}
