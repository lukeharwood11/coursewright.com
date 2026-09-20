import { useEffect } from "react";
import { ActivityList } from "./components/ActivityList";
import { useActivity } from "./hooks/useActivity";

export function ActivityPage() {
  const page = useActivity();

  useEffect(() => {
    document.title = "Activity · Course Wright";
  }, []);

  if (page.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading activity…</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Activity
      </h1>
      <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[var(--ink-soft)]">
        Posts that need your attention. Opening one marks it as seen.
      </p>
      {page.error ? (
        <p className="mt-4 text-[13px] text-[var(--amber-deep)]" role="alert">
          {page.error}
        </p>
      ) : null}
      <ActivityList
        items={page.items}
        openingId={page.openingId}
        onOpen={page.onOpen}
      />
    </div>
  );
}
