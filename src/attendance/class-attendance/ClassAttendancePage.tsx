import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { AttendanceGrid } from "@/attendance/sheet/components/AttendanceGrid";
import { studentPath } from "@/grading/model/paths";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { Input } from "@/ui/Input";
import { PageLoading } from "@/ui/PageLoading";
import { useToastOnError } from "@/ui/useToastOnError";
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

  return (
    <div>
      <DetailPageHeader
        backTo={classPath}
        backLabel="Back to class"
        title="Attendance"
        meta={
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            {sheet.classGroup.title}
          </span>
        }
      />
      <div className="space-y-4 px-5 py-4 md:px-8">
        <div className="max-w-[12rem]">
          <label className="block text-[12px] font-bold text-[var(--ink-soft)]" htmlFor="class-attendance-date">
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
        <p className="max-w-xl text-[14px] leading-relaxed text-[var(--ink-soft)]">
          This class is separate from the day. A day mark does not change this sheet.
          Choose a status again to clear it.
        </p>
        {sheet.rows.length === 0 ? (
          <p className="text-[14.5px] text-[var(--ink-soft)]">
            Add students on the{" "}
            <Link to={classPath} className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]">
              class page
            </Link>{" "}
            before taking attendance.
          </p>
        ) : (
          <AttendanceGrid
            sheetLabel="This class"
            rows={sheet.rows.map((row) => ({
              ...row,
              profileTo: studentPath(slug, row.studentId),
              sheetPending: sheet.pendingSheetId === row.studentId,
              dayPending: sheet.pendingDayId === row.studentId,
            }))}
            onSheetStatus={sheet.saveSheet}
            onDayStatus={sheet.saveDay}
          />
        )}
      </div>
    </div>
  );
}
