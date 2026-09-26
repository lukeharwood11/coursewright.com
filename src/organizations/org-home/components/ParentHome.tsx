import { useMemo, useState } from "react";
import { PrinterIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";
import { PageLoading } from "@/ui/PageLoading";
import {
  filterParentDashboard,
  toggleStudentId,
  type ParentDashboard,
} from "@/parent/model/dashboard";
import { printThisWeekPath } from "@/print/model/paths";
import { ParentDashboardBody } from "./ParentDashboardBody";
import { WeekStepper } from "./WeekStepper";
import type { OrganizationSummary } from "@/organizations/databridge/memberships";

export function ParentHome({
  firstName,
  organization,
  orgSlug,
  dashboard,
  loading,
  error: _error,
  preview = false,
  previewKind = null,
  weekStartParam = null,
  isCurrentWeek = true,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
}: {
  firstName: string;
  organization: OrganizationSummary;
  orgSlug: string;
  dashboard: ParentDashboard | null;
  loading: boolean;
  error: string | null;
  preview?: boolean;
  /** instructor = taught-course synthetic; empty-family = Parent/Student tab with no links */
  previewKind?: "instructor" | "empty-family" | null;
  weekStartParam?: string | null;
  isCurrentWeek?: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
}) {
  const [activeIds, setActiveIds] = useState<number[] | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const weekLabel = dashboard?.week.label ?? "This week";
  const allStudentIds = useMemo(
    () => dashboard?.students.map((student) => student.id) ?? [],
    [dashboard],
  );
  const selectedIds = activeIds ?? allStudentIds;
  const visible = dashboard
    ? filterParentDashboard(dashboard, selectedIds)
    : null;
  const printOptions = { weekStart: weekStartParam };
  const printTo =
    selectedIds.length > 0 && selectedIds.length < allStudentIds.length
      ? printThisWeekPath(orgSlug, selectedIds, undefined, printOptions)
      : printThisWeekPath(orgSlug, undefined, undefined, printOptions);

  const banner =
    previewKind === "instructor"
      ? dashboard?.hasActiveEnrollment
        ? "Preview shows this week the way a student enrolled in the courses you teach would see it — not your family’s home."
        : "Preview shows this week the way a student enrolled in the courses you teach would see it. You’re not teaching any published courses yet, so the list is empty."
      : previewKind === "empty-family"
        ? "This is what your family home looks like. You don’t have a linked student in this organization yet, so the list is empty."
        : null;
  const showBanner = Boolean(banner) && !bannerDismissed;

  return (
    <div className="px-5 py-4 md:px-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="text-[22px] font-semibold leading-snug text-[var(--ink)] md:text-[24px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Hi, {firstName}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--ink-soft)]">{weekLabel}</p>
          <div className="mt-2">
            <WeekStepper
              onPrev={onPrevWeek}
              onNext={onNextWeek}
              onThisWeek={onThisWeek}
              showThisWeek={!isCurrentWeek}
            />
          </div>
        </div>
        {selectedIds.length > 0 ? (
          <ButtonLink variant="secondary" to={printTo}>
            <PrinterIcon className="h-5 w-5" aria-hidden />
            Print this week
          </ButtonLink>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-[6px] border border-[var(--line)] px-3 py-[11px] text-[13px] font-bold text-[var(--ink-faint)]">
            <PrinterIcon className="h-5 w-5" aria-hidden />
            Print this week
          </span>
        )}
      </header>

      {showBanner && banner ? (
        <div
          role="status"
          className="mt-4 flex items-start gap-3 rounded-[10px] border border-[var(--slate)] bg-[var(--slate-tint)] px-3.5 py-3 text-[13.5px] leading-relaxed text-[var(--ink)]"
        >
          <p className="min-w-0 flex-1">{banner}</p>
          <button
            type="button"
            className="shrink-0 rounded-[6px] p-1 text-[var(--ink-soft)] hover:bg-[var(--paper)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            aria-label="Dismiss"
            onClick={() => setBannerDismissed(true)}
          >
            <XMarkIcon className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}

      {loading ? (
        <PageLoading embedded label="Loading this week…" />
      ) : null}

      {dashboard && visible && !loading ? (
        <ParentDashboardBody
          orgSlug={orgSlug}
          full={dashboard}
          visible={visible}
          selectedIds={selectedIds}
          preview={preview}
          previewKind={previewKind}
          isCurrentWeek={isCurrentWeek}
          schoolDays={organization.schoolDays}
          orgType={organization.orgType}
          onToggleStudent={(id) =>
            setActiveIds(toggleStudentId(selectedIds, id))
          }
        />
      ) : null}
    </div>
  );
}
