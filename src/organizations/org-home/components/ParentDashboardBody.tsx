import { useMemo, useState } from "react";
import { CourseLegend } from "@/calendar/components/CourseLegend";
import { WeekCalendar } from "@/calendar/components/WeekCalendar";
import { toggleHiddenCourse } from "@/calendar/model/events";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  parentWeekHasContent,
  type ParentDashboard,
} from "@/parent/model/dashboard";
import { parentWeekCalendar } from "@/parent/model/weekCalendar";
import { ParentAnnouncementList } from "./ParentAnnouncementList";
import { ParentFocusRail } from "./ParentFocusRail";
import { ParentStudentTags } from "./ParentStudentTags";
import type { OrgType } from "@/organizations/model/orgType";
import { orgTypeYourNoun } from "@/organizations/model/orgType";
import type { HomeDay } from "@/organizations/model/homeDays";
import type { SchoolDay } from "@/organizations/model/schoolDays";

export function ParentDashboardBody({
  orgSlug,
  full,
  visible,
  selectedIds,
  preview = false,
  previewKind = null,
  isCurrentWeek = true,
  onToggleStudent,
  schoolDays,
  homeDays,
  orgType,
}: {
  orgSlug: string;
  full: ParentDashboard;
  visible: ParentDashboard;
  selectedIds: number[];
  preview?: boolean;
  previewKind?: "instructor" | "empty-family" | null;
  isCurrentWeek?: boolean;
  onToggleStudent: (id: number) => void;
  schoolDays: readonly SchoolDay[];
  homeDays: readonly HomeDay[];
  orgType: OrgType;
}) {
  const { organization } = useOrgShell();
  const [hidden, setHidden] = useState<number[]>([]);
  const hiddenCourseIds = useMemo(() => new Set(hidden), [hidden]);

  const fullAnnouncements = organization.features.announcements
    ? full.announcements
    : [];
  const visibleForCalendar: ParentDashboard = {
    ...visible,
    announcements: organization.features.announcements ? visible.announcements : [],
    lessonPlans: organization.features.lessonPlans ? visible.lessonPlans : [],
    events: organization.features.events ? visible.events : [],
  };

  if (!full.hasActiveEnrollment && fullAnnouncements.length === 0) {
    if (previewKind === "instructor" || preview) {
      return (
        <p className="mt-4 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          Open a published course you teach in the sidebar to see it the way a
          student would — without editing tools.
        </p>
      );
    }
    return (
      <p className="mt-6 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        You’re not on a course yet. When your {orgTypeYourNoun(orgType)} adds you,
        this week’s materials will show up here.
      </p>
    );
  }

  const showTags = full.students.length > 1;
  const showStudentHeaders = visibleForCalendar.students.length > 1;
  const calendar = parentWeekCalendar(visibleForCalendar);
  const hasContent = parentWeekHasContent(visibleForCalendar);
  const hasFocus =
    visibleForCalendar.importantNow.length > 0 ||
    Boolean(visibleForCalendar.nextAssignedItem || visibleForCalendar.nextDueItem);

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

      {visibleForCalendar.announcements.length > 0 ? (
        <ParentAnnouncementList
          orgSlug={orgSlug}
          items={visibleForCalendar.announcements}
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
              {isCurrentWeek
                ? "Nothing on the calendar this week. Check back soon, or open a course when something’s ready."
                : "Nothing scheduled for this week. Try another week, or open a course when something’s ready."}
            </p>
          ) : (
            <div className="mt-4">
              <WeekCalendar
                orgSlug={orgSlug}
                weekStart={visibleForCalendar.week.start}
                weekNotes={calendar.weekNotes}
                lessonDays={calendar.lessonDays}
                chips={calendar.chips}
                events={calendar.events}
                hiddenCourseIds={hiddenCourseIds}
                layout="cards"
                schoolDays={schoolDays}
                homeDays={homeDays}
              />
            </div>
          )}
        </section>

        {hasFocus ? (
          <ParentFocusRail
            orgSlug={orgSlug}
            importantNow={visibleForCalendar.importantNow}
            nextAssigned={visibleForCalendar.nextAssignedItem}
            nextDue={visibleForCalendar.nextDueItem}
            showStudent={showStudentHeaders}
          />
        ) : null}
      </div>
    </div>
  );
}
