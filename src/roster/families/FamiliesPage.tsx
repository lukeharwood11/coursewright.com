import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useFamilies } from "./hooks/useFamilies";

export function FamiliesPage() {
  const { organization, families, loading, error } = useFamilies();

  useEffect(() => {
    document.title = `Families · ${organization.name} · Course Wright`;
  }, [organization.name]);

  return (
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Families
      </h1>
      <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
        Parent directory for this organization.
      </p>
      <p className="mt-2 text-[13px]">
        <Link
          to={`/my/${organization.slug}/roster`}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Roster
        </Link>
      </p>

      {loading ? (
        <p className="mt-6 text-[14px] text-[var(--ink-soft)]">Loading families…</p>
      ) : null}

      {error ? (
        <p className="mt-6 text-[13.5px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && families.length === 0 ? (
        <p className="mt-6 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          No families yet. Link parents and students into a household from the
          roster.
        </p>
      ) : null}

      {families.length > 0 ? (
        <ul className="mt-6 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
          {families.map((family) => (
            <li key={family.id}>
              <Link
                to={`/my/${organization.slug}/families/${family.id}`}
                className="block px-4 py-3 text-[15.5px] font-extrabold text-[var(--ink)] hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              >
                {family.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
