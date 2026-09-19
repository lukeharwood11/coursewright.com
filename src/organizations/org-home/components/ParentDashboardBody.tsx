import {
  datedMaterialCount,
  thisWeekStudents,
  type ParentDashboard,
} from "@/parent/model/dashboard";
import { ParentComingUpSection } from "./ParentComingUpSection";
import { ParentImportantNowList } from "./ParentImportantNowList";
import { ParentStudentTags } from "./ParentStudentTags";
import { ParentStudentWeek } from "./ParentStudentWeek";

export function ParentDashboardBody({
  orgSlug,
  full,
  visible,
  selectedIds,
  onToggleStudent,
}: {
  orgSlug: string;
  full: ParentDashboard;
  visible: ParentDashboard;
  selectedIds: number[];
  onToggleStudent: (id: number) => void;
}) {
  if (!full.hasActiveEnrollment) {
    return (
      <p className="mt-6 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        You’re not on a course yet. When your co-op adds you, this week’s
        materials will show up here.
      </p>
    );
  }

  const showTags = full.students.length > 1;
  const showStudentHeaders = visible.students.length > 1;
  const datedCount = datedMaterialCount(visible.students);
  const weekStudents = thisWeekStudents(visible.students);
  const hasComingUp = Boolean(visible.nextAssignedItem || visible.nextDueItem);
  const hasImportantNow = visible.importantNow.length > 0;
  const attentionGrid = hasComingUp && hasImportantNow;

  if (showTags && selectedIds.length === 0) {
    return (
      <div className="mt-6 flex flex-col gap-4">
        <ParentStudentTags
          students={full.students}
          selectedIds={selectedIds}
          onToggle={onToggleStudent}
        />
        <p className="text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          Choose a student at the top to see their work.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {showTags ? (
        <ParentStudentTags
          students={full.students}
          selectedIds={selectedIds}
          onToggle={onToggleStudent}
        />
      ) : null}

      {hasImportantNow || hasComingUp ? (
        <div
          className={
            attentionGrid
              ? "grid items-start content-start auto-rows-min gap-x-5 gap-y-3 md:grid-cols-2"
              : undefined
          }
        >
          {hasImportantNow ? (
            <ParentImportantNowList
              orgSlug={orgSlug}
              items={visible.importantNow}
            />
          ) : null}
          {hasComingUp ? (
            <ParentComingUpSection
              orgSlug={orgSlug}
              nextAssigned={visible.nextAssignedItem}
              nextDue={visible.nextDueItem}
              showStudent={showStudentHeaders}
            />
          ) : null}
        </div>
      ) : null}

      <section>
        <div className="mb-2">
          <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">This week</h2>
          <p className="mt-0.5 text-[13px] text-[var(--ink-faint)]">
            Work assigned for this week, and anything due this week.
          </p>
        </div>

        {datedCount === 0 ? (
          <p className="text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
            Nothing assigned or due this week. Check back soon, or open a course
            when something’s ready.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {weekStudents.map((student) => (
              <ParentStudentWeek
                key={student.id}
                orgSlug={orgSlug}
                student={student}
                showHeader={showStudentHeaders}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
