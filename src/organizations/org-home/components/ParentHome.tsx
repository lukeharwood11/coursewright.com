import { useMemo, useState } from "react";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";
import { PageLoading } from "@/ui/PageLoading";
import { toastNotImplemented } from "@/ui/toast";
import {
  filterParentDashboard,
  toggleStudentId,
  type ParentDashboard,
} from "@/parent/model/dashboard";
import { printThisWeekPath } from "@/print/model/paths";
import { ParentDashboardBody } from "./ParentDashboardBody";

export function ParentHome({
  firstName,
  orgSlug,
  dashboard,
  loading,
  error: _error,
  preview = false,
}: {
  firstName: string;
  orgSlug: string;
  dashboard: ParentDashboard | null;
  loading: boolean;
  error: string | null;
  preview?: boolean;
}) {
  const [activeIds, setActiveIds] = useState<number[] | null>(null);
  const weekLabel = dashboard?.week.label ?? "This week";
  const allStudentIds = useMemo(
    () => dashboard?.students.map((student) => student.id) ?? [],
    [dashboard],
  );
  const selectedIds = activeIds ?? allStudentIds;
  const visible = dashboard
    ? filterParentDashboard(dashboard, selectedIds)
    : null;
  const printTo =
    selectedIds.length > 0 && selectedIds.length < allStudentIds.length
      ? printThisWeekPath(orgSlug, selectedIds)
      : printThisWeekPath(orgSlug);

  return (
    <div className="px-5 pb-24 pt-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="text-[22px] font-semibold leading-snug text-[var(--ink)] md:text-[24px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Hi, {firstName}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--ink-soft)]">{weekLabel}</p>
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

      {preview ? (
        <p className="mt-4 rounded-[10px] border border-[var(--slate)] bg-[var(--slate-tint)] px-3.5 py-3 text-[13.5px] leading-relaxed text-[var(--ink)]">
          This is a preview of the parent home. Families with enrolled students
          see this week’s work here. You don’t have a linked student in this
          organization yet, so the list is empty.
        </p>
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
          onToggleStudent={(id) =>
            setActiveIds(toggleStudentId(selectedIds, id))
          }
        />
      ) : null}

      <nav
        className="cw-org-chrome fixed inset-x-0 bottom-0 border-t border-[var(--line-soft)] bg-[var(--surface)] md:hidden"
        aria-label="Parent"
      >
        <div className="mx-auto grid max-w-lg grid-cols-2">
          <span className="py-3 text-center text-[11.5px] font-bold text-[var(--green)]">
            This week
          </span>
          <button
            type="button"
            className="py-3 text-center text-[11.5px] font-bold text-[var(--ink-faint)]"
            onClick={() => toastNotImplemented("Progress")}
          >
            Progress
          </button>
        </div>
      </nav>
    </div>
  );
}
