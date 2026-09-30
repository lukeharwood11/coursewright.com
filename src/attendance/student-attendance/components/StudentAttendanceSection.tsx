import {
  DAY_STATUSES,
  attendanceStatusLabel,
  formatAttendanceDate,
  type DayBadgeStatus,
} from "@/attendance/model/daySummary";
import { AttendanceStatusPicker } from "@/attendance/sheet/components/AttendanceStatusPicker";
import { Badge } from "@/ui/Badge";
import { Input } from "@/ui/Input";
import { useToastOnError } from "@/ui/useToastOnError";
import { useStudentAttendance } from "../hooks/useStudentAttendance";

function badgeVariant(status: DayBadgeStatus): "green" | "amber" | "slate" {
  if (status === "present") return "green";
  if (status === "absent" || status === "late") return "amber";
  return "slate";
}

export function StudentAttendanceSection({ studentId }: { studentId: number }) {
  const attendance = useStudentAttendance(studentId);
  useToastOnError(attendance.error);

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Attendance</h2>
        <div className="w-full max-w-[12rem]">
          <label className="block text-[12px] font-bold text-[var(--ink-soft)]" htmlFor="student-attendance-through">
            Show through
          </label>
          <Input
            id="student-attendance-through"
            type="date"
            value={attendance.through}
            onChange={(event) => {
              if (event.target.value) attendance.setThrough(event.target.value);
            }}
          />
        </div>
      </div>
      {attendance.loading ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading attendance…</p>
      ) : attendance.days.length === 0 ? (
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--ink-soft)]">
          No attendance in these dates.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--line-soft)]">
          {attendance.days.map((day) => (
            <li key={day.onDate} className="space-y-2 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[14.5px] font-extrabold text-[var(--ink)]">
                  {formatAttendanceDate(day.onDate)}
                </p>
                {day.badge ? (
                  <Badge variant={badgeVariant(day.badge)}>
                    {attendanceStatusLabel(day.badge)}
                  </Badge>
                ) : (
                  <span className="text-[12px] font-bold text-[var(--ink-soft)]">Not marked</span>
                )}
              </div>
              {attendance.canWrite ? (
                <AttendanceStatusPicker
                  label="Day"
                  options={DAY_STATUSES}
                  value={day.dayStatus}
                  disabled={attendance.pendingDate === day.onDate}
                  onChange={(status) => attendance.saveDay(day.onDate, status)}
                />
              ) : null}
              {day.sheets.length > 0 ? (
                <ul className="space-y-1">
                  {day.sheets.map((sheet, index) => (
                    <li key={`${day.onDate}-${index}`} className="text-[13.5px] text-[var(--ink)]">
                      {sheet.title} · {attendanceStatusLabel(sheet.status)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
