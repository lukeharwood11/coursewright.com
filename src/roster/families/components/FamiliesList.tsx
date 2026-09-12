import { Link } from "react-router-dom";

export function FamiliesList({
  orgSlug,
  families,
}: {
  orgSlug: string;
  families: Array<{ id: number; label: string; summary: string }>;
}) {
  if (families.length === 0) {
    return (
      <p className="mt-6 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        No families yet. Create a named group, add students from the roster,
        and link a parent to those students. Parent access stays enrollment plus
        the student link — family membership itself does not grant materials.
      </p>
    );
  }

  return (
    <ul className="mt-6 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
      {families.map((family) => (
        <li key={family.id}>
          <Link
            to={`/my/${orgSlug}/families/${family.id}`}
            className="block px-4 py-3 hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
          >
            <span className="block text-[15.5px] font-extrabold text-[var(--ink)]">
              {family.label}
            </span>
            <span className="mt-0.5 block text-[12.5px] text-[var(--ink-faint)]">
              {family.summary}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
