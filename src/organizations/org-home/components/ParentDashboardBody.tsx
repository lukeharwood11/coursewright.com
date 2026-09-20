import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import {
  datedMaterialCount,
  dueThisWeekStudents,
  extraAssignedThisWeekCount,
  extraAssignedThisWeekLabel,
  parentHomeStudentSections,
  thisWeekStudents,
  type ParentDashboard,
} from "@/parent/model/dashboard";
import { Button } from "@/ui/Button";
import { ParentAnnouncementList } from "./ParentAnnouncementList";
import { ParentBulletinList } from "./ParentBulletinList";
import { ParentComingUpSection } from "./ParentComingUpSection";
import { ParentImportantNowList } from "./ParentImportantNowList";
import { ParentStudentTags } from "./ParentStudentTags";
import { ParentStudentWeek } from "./ParentStudentWeek";

export function ParentDashboardBody({
  orgSlug,
  full,
  visible,
  selectedIds,
  preview = false,
  onToggleStudent,
}: {
  orgSlug: string;
  full: ParentDashboard;
  visible: ParentDashboard;
  selectedIds: number[];
  preview?: boolean;
  onToggleStudent: (id: number) => void;
}) {
  const [showExtraAssigned, setShowExtraAssigned] = useState(false);
  const hasAnnouncements = visible.announcements.length > 0;

  if (!full.hasActiveEnrollment && full.announcements.length === 0) {
    if (preview) {
      return (
        <p className="mt-4 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          Open a published course in the sidebar to see it the way a family
          would — without editing tools.
        </p>
      );
    }
    return (
      <p className="mt-6 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        You’re not on a course yet. When your co-op adds you, this week’s
        materials will show up here.
      </p>
    );
  }

  const showTags = full.students.length > 1;
  const showStudentHeaders = visible.students.length > 1;
  const extraCount = extraAssignedThisWeekCount(visible.students, visible.week);
  const showExtra = showExtraAssigned && extraCount > 0;
  const datedCount = datedMaterialCount(visible.students);
  const dueStudents = dueThisWeekStudents(visible.students, visible.week);
  const dueCount = datedMaterialCount(dueStudents);
  const weekStudents = showExtra
    ? thisWeekStudents(visible.students)
    : dueStudents;
  const groupByStudent = showStudentHeaders;
  const studentSections = groupByStudent
    ? parentHomeStudentSections(
        visible.students,
        weekStudents,
        visible.bulletins,
        visible.announcements,
      )
    : [];
  const hasComingUp = Boolean(visible.nextAssignedItem || visible.nextDueItem);
  const hasImportantNow = visible.importantNow.length > 0;
  const hasBulletins = visible.bulletins.length > 0;
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

      {hasAnnouncements && !groupByStudent ? (
        <ParentAnnouncementList
          orgSlug={orgSlug}
          items={visible.announcements}
          showStudent={false}
        />
      ) : null}

      {hasBulletins && !groupByStudent ? (
        <ParentBulletinList
          orgSlug={orgSlug}
          items={visible.bulletins}
          showStudent={false}
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
            {extraCount > 0
              ? "Work due this week. Other assigned work is under More assigned this week."
              : "Work assigned for this week, and anything due this week."}
          </p>
        </div>

        {datedCount === 0 && !(groupByStudent && (hasBulletins || hasAnnouncements)) ? (
          <p className="text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
            Nothing assigned or due this week. Check back soon, or open a course
            when something’s ready.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {dueCount === 0 && extraCount > 0 && !showExtra ? (
              <p className="text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
                Nothing due this week.
              </p>
            ) : null}
            {groupByStudent
              ? studentSections.map((section) => (
                  <ParentStudentWeek
                    key={section.student.id}
                    orgSlug={orgSlug}
                    student={section.weekStudent ?? {
                      ...section.student,
                      courses: [],
                    }}
                    showHeader
                    lead={
                      section.announcements.length > 0 ||
                      section.bulletins.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {section.announcements.length > 0 ? (
                            <ParentAnnouncementList
                              orgSlug={orgSlug}
                              items={section.announcements}
                              showStudent={false}
                            />
                          ) : null}
                          {section.bulletins.length > 0 ? (
                            <ParentBulletinList
                              orgSlug={orgSlug}
                              items={section.bulletins}
                              showStudent={false}
                            />
                          ) : null}
                        </div>
                      ) : null
                    }
                  />
                ))
              : weekStudents.map((student) => (
                  <ParentStudentWeek
                    key={student.id}
                    orgSlug={orgSlug}
                    student={student}
                    showHeader={false}
                  />
                ))}
            {extraCount > 0 ? (
              <Button
                variant="secondary"
                className="self-start px-3 py-2 text-[13px]"
                aria-expanded={showExtra}
                onClick={() => setShowExtraAssigned((open) => !open)}
              >
                {showExtra ? (
                  <ChevronUpIcon className="h-4 w-4" aria-hidden />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" aria-hidden />
                )}
                {showExtra
                  ? "Hide extra assigned work"
                  : extraAssignedThisWeekLabel(extraCount)}
              </Button>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
