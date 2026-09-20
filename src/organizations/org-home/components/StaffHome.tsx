import { PlusIcon } from "@heroicons/react/24/outline";
import type { StaffDashboard } from "@/organizations/model/staffDashboard";
import { newCoursePath } from "@/courses/model/paths";
import { ButtonLink } from "@/ui/Button";
import {
  StaffAttentionList,
  StaffCoursesPreview,
  StaffGettingStarted,
  StaffPeopleSnapshot,
  StaffWeekSummary,
} from "./StaffDashboardSections";

export function StaffHome({
  orgName,
  orgSlug,
  dashboard,
  loading,
  error: _error,
}: {
  orgName: string;
  orgSlug: string;
  dashboard: StaffDashboard | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {orgName}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
            {dashboard?.week.label ?? "Organization overview"}
          </p>
        </div>
        <ButtonLink to={newCoursePath(orgSlug)}>
          <PlusIcon className="h-5 w-5" aria-hidden />
          Create course
        </ButtonLink>
      </div>

      {loading ? (
        <p className="mt-6 text-[14px] text-[var(--ink-soft)]">Loading overview…</p>
      ) : null}

      {dashboard && !loading ? (
        <div className="mt-6 flex flex-col gap-8">
          {dashboard.setup.needsCourse || dashboard.setup.needsStudents ? (
            <StaffGettingStarted
              orgSlug={orgSlug}
              needsCourse={dashboard.setup.needsCourse}
              needsStudents={dashboard.setup.needsStudents}
            />
          ) : null}
          <StaffAttentionList orgSlug={orgSlug} items={dashboard.attention} />
          <StaffCoursesPreview orgSlug={orgSlug} dashboard={dashboard} />
          {!dashboard.setup.needsCourse ? (
            <StaffWeekSummary orgSlug={orgSlug} dashboard={dashboard} />
          ) : null}
          <StaffPeopleSnapshot orgSlug={orgSlug} people={dashboard.people} />
        </div>
      ) : null}
    </div>
  );
}
