import { useEffect } from "react";
import { Link } from "react-router-dom";
import { coursePath, courseRosterPath } from "@/courses/model/paths";
import { SHEET_STATUSES, courseAttendanceHelp } from "@/attendance/model/daySummary";
import { AttendanceDateField } from "@/attendance/sheet/components/AttendanceDateField";
import { AttendanceStudentList } from "@/attendance/sheet/components/AttendanceStudentList";
import { AttendanceUndoNotice } from "@/attendance/sheet/components/AttendanceUndoNotice";
import { studentPath } from "@/grading/model/paths";
import { Button } from "@/ui/Button";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { ListPagination } from "@/ui/ListPagination";
import { PageLoading } from "@/ui/PageLoading";
import { useToastOnError } from "@/ui/useToastOnError";
import { FillPackageBanner } from "@/grading/fill-cycles/components/FillPackageBanner";
import { useCourseAttendance } from "./hooks/useCourseAttendance";

export function CourseAttendancePage() {
  const sheet = useCourseAttendance();
  useToastOnError(sheet.error);

  useEffect(() => {
    document.title = sheet.course
      ? `Attendance · ${sheet.course.title} · Course Wright`
      : "Attendance · Course Wright";
  }, [sheet.course]);

  if (sheet.loading) return <PageLoading label="Loading attendance…" />;

  if (sheet.notFound || !sheet.course) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that course
        </h1>
      </div>
    );
  }

  const slug = sheet.organization.slug;
  const course = sheet.course;

  return (
    <div>
      <DetailPageHeader
        backTo={coursePath(slug, course.id)}
        backLabel="Back to course"
        title="Attendance"
        meta={
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            {course.title}
          </span>
        }
      />
      <div className="space-y-4 px-5 py-4 md:px-8">
        <FillPackageBanner kind="attendance" courseId={course.id} />
        <div className="flex flex-wrap items-end gap-3">
          <AttendanceDateField
            id="course-attendance-date"
            value={sheet.onDate}
            onChange={sheet.setOnDate}
          />
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
        <p className="max-w-xl text-[14px] leading-relaxed text-[var(--ink-soft)]">
          {courseAttendanceHelp(sheet.canManage)}
        </p>
        {sheet.undo ? (
          <AttendanceUndoNotice
            message={sheet.undo.message}
            disabled={sheet.pending}
            onUndo={sheet.undoLast}
          />
        ) : null}
        {sheet.rows.length === 0 ? (
          <p className="text-[14.5px] text-[var(--ink-soft)]">
            Enroll students on the{" "}
            <Link
              to={courseRosterPath(slug, course.id)}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              course roster
            </Link>{" "}
            before taking attendance.
          </p>
        ) : (
          <>
            <AttendanceStudentList
              rows={sheet.pageRows.map((row) => ({
                studentId: row.studentId,
                name: row.name,
                profileTo: studentPath(slug, row.studentId),
                status: row.sheetStatus,
                canWrite: row.canWriteSheet,
                dayFooter: row.dayFooter,
              }))}
              options={SHEET_STATUSES}
              pending={sheet.pending}
              ariaLabel="Course"
              onStatus={sheet.saveSheet}
            />
            <ListPagination
              rangeLabel={sheet.rangeLabel}
              page={sheet.page}
              pageCount={sheet.pageCount}
              canPrev={sheet.canPrev}
              canNext={sheet.canNext}
              onPrev={() => sheet.setPage(sheet.page - 1)}
              onNext={() => sheet.setPage(sheet.page + 1)}
            />
          </>
        )}
      </div>
    </div>
  );
}
