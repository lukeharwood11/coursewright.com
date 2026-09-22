import { useMemo, useState } from "react";
import { CourseLegend } from "@/calendar/components/CourseLegend";
import { WeekCalendar } from "@/calendar/components/WeekCalendar";
import { toggleHiddenCourse } from "@/calendar/model/events";
import {
  parentWeekHasContent,
  type ParentDashboard,
} from "@/parent/model/dashboard";
import { parentWeekCalendar } from "@/parent/model/weekCalendar";
import { ParentAnnouncementList } from "./ParentAnnouncementList";
import { ParentFocusRail } from "./ParentFocusRail";
import { ParentStudentTags } from "./ParentStudentTags";
import type { SchoolDay } from "@/organizations/model/schoolDays";

export function ParentDashboardBody({
  orgSlug,
  full,
  visible,
  selectedIds,
  preview = false,
  onToggleStudent,
  schoolDays,
}: {
  orgSlug: string;
  full: ParentDashboard;
  visible: ParentDashboard;
  selectedIds: number[];
  preview?: boolean;
  onToggleStudent: (id: number) => void;
  schoolDays: readonly SchoolDay[];
}) {
  const [hidden, setHidden] = useState<number[]>([]);
  const hiddenCourseIds = useMemo(() => new Set(hidden), [hidden]);

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
  const calendar = parentWeekCalendar(visible);
  const hasContent = parentWeekHasContent(visible);
  const hasFocus =
    visible.importantNow.length > 0 ||
    Boolean(visible.nextAssignedItem || visible.nextDueItem);

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
    <div className="mt-6 flex flex-col gap-4">
      {showTags ? (
        <ParentStudentTags
          students={full.students}
          selectedIds={selectedIds}
          onToggle={onToggleStudent}
        />
      ) : null}

      {visible.announcements.length > 0 ? (
        <ParentAnnouncementList
          orgSlug={orgSlug}
          items={visible.announcements}
          showStudent={showStudentHeaders}
        />
      ) : null}

      <div
        className={
          hasFocus
            ? "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"
            : undefined
        }
      >
        <section>
          <CourseLegend
            courses={calendar.courses}
            hiddenCourseIds={hiddenCourseIds}
            onToggle={(id) => setHidden((current) => toggleHiddenCourse(current, id))}
          />
          {!hasContent ? (
            <p className="mt-4 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
              Nothing on the calendar this week. Check back soon, or open a
              course when something’s ready.
            </p>
          ) : (
            <div className="mt-4">
              <WeekCalendar
                orgSlug={orgSlug}
                weekStart={visible.week.start}
                weekNotes={calendar.weekNotes}
                lessonDays={calendar.lessonDays}
                chips={calendar.chips}
                events={calendar.events}
                hiddenCourseIds={hiddenCourseIds}
                layout="cards"
                schoolDays={schoolDays}
              />
            </div>
          )}
        </section>

        {hasFocus ? (
          <ParentFocusRail
            orgSlug={orgSlug}
            importantNow={visible.importantNow}
            nextAssigned={visible.nextAssignedItem}
            nextDue={visible.nextDueItem}
            showStudent={showStudentHeaders}
          />
        ) : null}
      </div>
    </div>
  );
}
