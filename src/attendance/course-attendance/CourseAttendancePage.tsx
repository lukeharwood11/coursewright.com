import { useEffect } from "react";
import { Link } from "react-router-dom";
import { coursePath, courseRosterPath } from "@/courses/model/paths";
import { AttendanceGrid } from "@/attendance/sheet/components/AttendanceGrid";
import { studentPath } from "@/grading/model/paths";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { Input } from "@/ui/Input";
import { PageLoading } from "@/ui/PageLoading";
import { useToastOnError } from "@/ui/useToastOnError";
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
        <div className="max-w-[12rem]">
          <label className="block text-[12px] font-bold text-[var(--ink-soft)]" htmlFor="course-attendance-date">
            Date
          </label>
          <Input
            id="course-attendance-date"
            type="date"
            value={sheet.onDate}
            onChange={(event) => {
              if (event.target.value) sheet.setOnDate(event.target.value);
            }}
          />
        </div>
        <p className="max-w-xl text-[14px] leading-relaxed text-[var(--ink-soft)]">
          This course is separate from the day. A day mark does not change this sheet.
          Choose a status again to clear it.
        </p>
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
          <AttendanceGrid
            sheetLabel="This course"
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
