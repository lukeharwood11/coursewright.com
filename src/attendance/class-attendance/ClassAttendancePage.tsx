import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { ClassSectionTabs } from "@/roster/class-roster/components/ClassSectionTabs";
import { classAttendanceHelp } from "@/attendance/model/daySummary";
import { studentsClassesPath } from "@/grading/model/paths";
import { Button } from "@/ui/Button";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { Input } from "@/ui/Input";
import { PageLoading } from "@/ui/PageLoading";
import { Select } from "@/ui/Select";
import { useToastOnError } from "@/ui/useToastOnError";
import { AttendanceUndoNotice } from "@/attendance/sheet/components/AttendanceUndoNotice";
import { ClassAttendanceRows } from "./components/ClassAttendanceRows";
import { useClassAttendance } from "./hooks/useClassAttendance";

export function ClassAttendancePage() {
  const sheet = useClassAttendance();
  useToastOnError(sheet.error);

  useEffect(() => {
    document.title = sheet.classGroup
      ? `Attendance · ${sheet.classGroup.title} · Course Wright`
      : "Attendance · Course Wright";
  }, [sheet.classGroup]);

  if (sheet.roleReady && !sheet.staffBrowse && Number.isFinite(sheet.classId)) {
    return (
      <Navigate
        to={`/my/${sheet.organization.slug}/classes/${sheet.classId}`}
        replace
      />
    );
  }

  if (sheet.loading) return <PageLoading label="Loading attendance…" />;

  if (sheet.notFound || !sheet.classGroup) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that class
        </h1>
      </div>
    );
  }

  const slug = sheet.organization.slug;
  const classPath = `/my/${slug}/classes/${sheet.classGroup.id}`;
  const backTo = studentsClassesPath(slug);

  return (
    <div>
      <DetailPageHeader
        backTo={backTo}
        backLabel="Back to students"
        title={sheet.classGroup.title}
      />
      <div className="space-y-4 px-5 py-4 md:px-8">
        <ClassSectionTabs
          orgSlug={slug}
          classId={sheet.classGroup.id}
          selected="attendance"
        />
        <div className="flex flex-wrap items-end gap-3">
          <div className="max-w-[12rem]">
            <label
              className="block text-[12px] font-bold text-[var(--ink-soft)]"
              htmlFor="class-attendance-date"
            >
              Date
            </label>
            <Input
              id="class-attendance-date"
              type="date"
              value={sheet.onDate}
              onChange={(event) => {
                if (event.target.value) sheet.setOnDate(event.target.value);
              }}
            />
          </div>
          {sheet.recordingOptions.length > 1 ? (
            <label className="block min-w-[12rem]">
              <span className="block text-[12px] font-bold text-[var(--ink-soft)]">
                Showing
              </span>
              <Select
                wrapperClassName="mt-0 w-full"
                value={sheet.scopeValue}
                onChange={(event) => sheet.setScope(event.target.value)}
              >
                {sheet.recordingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
          {sheet.showMarkAll ? (
            <Button
              type="button"
              variant="secondary"
              disabled={sheet.pending}
              onClick={sheet.markAllPresent}
            >
              Mark all Present
            </Button>
          ) : null}
        </div>
        {sheet.rows.length > 0 ? (
          <p className="max-w-xl text-[14px] leading-relaxed text-[var(--ink-soft)]">
            {classAttendanceHelp({
              canWrite: sheet.canWriteAny,
              scope: sheet.scope.kind,
            })}
          </p>
        ) : null}
        {sheet.undo ? (
          <AttendanceUndoNotice
            message={sheet.undo.message}
            disabled={sheet.pending}
            onUndo={sheet.undoLast}
          />
        ) : null}
        {sheet.rows.length === 0 ? (
          <p className="text-[14.5px] text-[var(--ink-soft)]">
            {sheet.scope.kind === "course" ? (
              <>No students in this class are on that course for this date.</>
            ) : (
              <>
                Add students on the{" "}
                <Link
                  to={classPath}
                  className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
                >
                  class page
                </Link>{" "}
                before taking attendance.
              </>
            )}
          </p>
        ) : (
          <ClassAttendanceRows
            orgSlug={slug}
            scope={sheet.scope}
            scopeValue={sheet.scopeValue}
            rows={sheet.rows}
            pending={sheet.pending}
            onStatus={sheet.saveOne}
            onScope={sheet.setScope}
          />
        )}
      </div>
    </div>
  );
}
