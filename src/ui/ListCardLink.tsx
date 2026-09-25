import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/** Shared list-row card chrome for announcements, discussions, and similar feeds. */
export function ListCardLink({
  to,
  highlighted = false,
  leading,
  children,
}: {
  to: string;
  /** Unread / attention state — green border and tint. */
  highlighted?: boolean;
  leading?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 ${
        highlighted
          ? "border-[var(--green)] bg-[var(--green-tint)]"
          : "border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--green-tint)]"
      }`}
    >
      {leading}
      <span className="min-w-0 flex-1">{children}</span>
    </Link>
  );
}
