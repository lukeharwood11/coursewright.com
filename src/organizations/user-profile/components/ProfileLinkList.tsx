import { Link } from "react-router-dom";
import type { OrgPersonLink } from "@/organizations/databridge/people";

export function ProfileLinkList({
  heading,
  empty,
  items,
  hrefFor,
}: {
  heading: string;
  empty: string;
  items: OrgPersonLink[];
  hrefFor?: (item: OrgPersonLink) => string | null;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">{heading}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">{empty}</p>
      ) : (
        <ul className="mt-2 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
          {items.map((item) => {
            const href = hrefFor?.(item) ?? null;
            return (
              <li
                key={item.id}
                className="border-b border-[var(--line-soft)] last:border-b-0"
              >
                {href ? (
                  <Link
                    to={href}
                    className="block px-4 py-3 text-[14.5px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)]"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <p className="px-4 py-3 text-[14.5px] font-bold text-[var(--ink)]">
                    {item.title}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
