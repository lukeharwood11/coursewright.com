import { useEffect } from "react";
import { useToastOnError } from "@/ui/useToastOnError";
import { ActivityList } from "./components/ActivityList";
import { useActivity } from "./hooks/useActivity";

export function ActivityPage() {
  const page = useActivity();
  useToastOnError(page.error);

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
      <ActivityList
        items={page.items}
        openingId={page.openingId}
        onOpen={page.onOpen}
      />
    </div>
  );
}
