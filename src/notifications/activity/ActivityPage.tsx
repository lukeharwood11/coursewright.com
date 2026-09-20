import { PageLoading } from "@/ui/PageLoading";
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
      <PageLoading label="Loading activity…" />
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
