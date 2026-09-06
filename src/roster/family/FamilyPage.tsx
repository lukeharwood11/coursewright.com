import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useFamily } from "./hooks/useFamily";

export function FamilyPage() {
  const { organization, family, title, loading, error, notFound } = useFamily();

  useEffect(() => {
    document.title = title ? `${title} · Course Wright` : "Family · Course Wright";
  }, [title]);

  if (loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading family…</p>
      </div>
    );
  }

  if (notFound || !family || !title) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that family
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          It may have been removed, or you may not have access.
        </p>
        {error ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]">{error}</p>
        ) : null}
        <p className="mt-4 text-[13px]">
          <Link
            to={`/my/${organization.slug}/families`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to families
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        Students and parents in this household will show up here next.
      </p>
      <p className="mt-4 text-[13px]">
        <Link
          to={`/my/${organization.slug}/families`}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Back to families
        </Link>
      </p>
    </div>
  );
}
