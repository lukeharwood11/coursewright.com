export function firstNameFrom(name: string, email: string): string {
  const trimmed = name.trim();
  if (trimmed) {
    const first = trimmed.split(/\s+/)[0];
    if (first) return first;
  }
  const fromEmail = email.split("@")[0];
  return fromEmail || "there";
}
