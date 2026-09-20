import type {
  ParentDashboardNextItem,
  ParentImportantNowItem,
} from "@/parent/model/dashboard";
import { ParentComingUpSection } from "./ParentComingUpSection";
import { ParentImportantNowList } from "./ParentImportantNowList";

export function ParentFocusRail({
  orgSlug,
  importantNow,
  nextAssigned,
  nextDue,
  showStudent,
}: {
  orgSlug: string;
  importantNow: ParentImportantNowItem[];
  nextAssigned: ParentDashboardNextItem | null;
  nextDue: ParentDashboardNextItem | null;
  showStudent: boolean;
}) {
  const hasImportantNow = importantNow.length > 0;
  const hasComingUp = Boolean(nextAssigned || nextDue);
  if (!hasImportantNow && !hasComingUp) return null;

  return (
    <aside className="flex flex-col gap-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Focus</h2>
      {hasImportantNow ? (
        <ParentImportantNowList orgSlug={orgSlug} items={importantNow} />
      ) : null}
      {hasComingUp ? (
        <ParentComingUpSection
          orgSlug={orgSlug}
          nextAssigned={nextAssigned}
          nextDue={nextDue}
          showStudent={showStudent}
        />
      ) : null}
    </aside>
  );
}
