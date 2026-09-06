function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  if (!first || !last) return "?";
  return `${first}${last}`.toUpperCase();
}

export function Avatar({
  name,
  size = 28,
}: {
  name: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--green)] font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
