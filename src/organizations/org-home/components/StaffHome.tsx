import { PlusIcon } from "@heroicons/react/24/outline";
import type { StaffDashboard } from "@/organizations/model/staffDashboard";
import { newCoursePath } from "@/courses/model/paths";
import { ButtonLink } from "@/ui/Button";
import { PageLoading } from "@/ui/PageLoading";
import {
  StaffAttentionList,
  StaffCoursesPreview,
  StaffGettingStarted,
  StaffPeopleSnapshot,
  StaffWeekSummary,
} from "./StaffDashboardSections";
export function StaffHome({
  orgSlug,
  dashboard,
  loading,
  error: _error,
  canCreate,
}: {
  orgSlug: string;
  dashboard: StaffDashboard | null;
  loading: boolean;
  error: string | null;
  canCreate: boolean;
}) {
  return (
    <div className="px-5 py-4 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Overview
          </h1>
          <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
            {dashboard?.week.label ?? "Organization overview"}
          </p>
        </div>
        {canCreate ? (
          <ButtonLink to={newCoursePath(orgSlug)}>
            <PlusIcon className="h-5 w-5" aria-hidden />
            Create course
          </ButtonLink>
        ) : null}
      </div>

      {loading ? (
        <PageLoading embedded label="Loading overview…" />
      ) : null}

      {dashboard && !loading ? (
        <div className="mt-6 flex flex-col gap-8">
          {dashboard.setup.needsCourse || dashboard.setup.needsStudents ? (
            <StaffGettingStarted
              orgSlug={orgSlug}
              needsCourse={dashboard.setup.needsCourse}
              needsStudents={dashboard.setup.needsStudents}
              canCreate={canCreate}
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
