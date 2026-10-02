import {
  DAY_STATUSES,
  SHEET_STATUSES,
  type DayStatus,
  type SheetStatus,
} from "@/attendance/model/daySummary";
import type {
  ClassAttendanceRow,
  ClassAttendanceScope,
} from "@/attendance/class-attendance/hooks/useClassAttendance";
import { AttendanceStudentList } from "@/attendance/sheet/components/AttendanceStudentList";
import { studentPath } from "@/grading/model/paths";

function scopeAriaLabel(scope: ClassAttendanceScope): string {
  if (scope.kind === "day") return "Day";
  if (scope.kind === "class") return "Class";
  return "Course";
}

export function ClassAttendanceRows({
  orgSlug,
  scope,
  rows,
  pending,
  onStatus,
}: {
  orgSlug: string;
  scope: ClassAttendanceScope;
  rows: ClassAttendanceRow[];
  pending: boolean;
  onStatus: (studentId: number, status: DayStatus | SheetStatus | null) => void;
}) {
  return (
    <AttendanceStudentList
      rows={rows.map((row) => ({
        studentId: row.studentId,
        name: row.name,
        profileTo: studentPath(orgSlug, row.studentId),
        status: row.status,
        canWrite: row.canWrite,
        dayFooter: row.dayFooter,
      }))}
      options={scope.kind === "day" ? DAY_STATUSES : SHEET_STATUSES}
      pending={pending}
      ariaLabel={scopeAriaLabel(scope)}
      onStatus={onStatus}
    />
  );
}
