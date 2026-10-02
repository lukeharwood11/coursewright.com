import { Link } from "react-router-dom";
import {
  DAY_STATUSES,
  SHEET_STATUSES,
  attendanceStatusLabel,
  partialReasonCopy,
  type DayStatus,
  type SheetStatus,
} from "@/attendance/model/daySummary";
import type {
  ClassAttendanceRow,
  ClassAttendanceScope,
} from "@/attendance/class-attendance/hooks/useClassAttendance";
import { studentPath } from "@/grading/model/paths";
import { Badge } from "@/ui/Badge";
import { AttendanceClearButton } from "@/attendance/sheet/components/AttendanceClearButton";
import { AttendanceStatusPicker } from "@/attendance/sheet/components/AttendanceStatusPicker";

function badgeVariant(status: string): "green" | "amber" | "slate" {
  if (status === "present") return "green";
  if (status === "absent" || status === "late") return "amber";
  return "slate";
}

function scopeLabel(scope: ClassAttendanceScope): string {
  if (scope.kind === "day") return "Day";
  if (scope.kind === "class") return "This class";
  return "This course";
}

export function ClassAttendanceRows({
  orgSlug,
  scope,
  scopeValue,
  rows,
  pending,
  onStatus,
  onScope,
}: {
  orgSlug: string;
  scope: ClassAttendanceScope;
  scopeValue: string;
  rows: ClassAttendanceRow[];
  pending: boolean;
  onStatus: (studentId: number, status: DayStatus | SheetStatus | null) => void;
  onScope: (scope: string) => void;
}) {
  const label = scopeLabel(scope);

  return (
    <ul className="divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
      {rows.map((row) => {
        const why = partialReasonCopy(row.partialReason);
        return (
          <li key={row.studentId} className="space-y-3 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                to={studentPath(orgSlug, row.studentId)}
                className="text-[15px] font-extrabold text-[var(--ink)] hover:text-[var(--green-deep)]"
              >
                {row.name}
              </Link>
              <span className="flex flex-wrap items-center gap-2">
                {row.badge ? (
                  <Badge variant={badgeVariant(row.badge)}>
                    {attendanceStatusLabel(row.badge)}
                  </Badge>
                ) : (
                  <span className="text-[12px] font-bold text-[var(--ink-soft)]">Not marked</span>
                )}
                {row.dayMark ? (
                  <span className="text-[12px] font-bold text-[var(--ink-soft)]">Day mark</span>
                ) : null}
              </span>
            </div>
            {why ? <p className="text-[13px] text-[var(--ink-soft)]">{why}</p> : null}
            {row.lines.length > 0 ? (
              <ul className="space-y-1">
                {row.lines.map((line) => (
                  <li key={line.key} className="flex flex-wrap items-center gap-x-2 text-[13.5px] text-[var(--ink)]">
                    {line.href ? (
                      <Link
                        to={line.href}
                        className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
                      >
                        {line.title}
                      </Link>
                    ) : (
                      <span>{line.title}</span>
                    )}
                    <span>
                      · {line.status ? attendanceStatusLabel(line.status) : "Not marked"}
                    </span>
                    {line.correctScope && line.correctScope !== scopeValue ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (line.correctScope) onScope(line.correctScope);
                        }}
                        className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
                      >
                        Correct
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {row.canWrite ? (
              <div className="flex flex-wrap items-end gap-2">
                {scope.kind === "day" ? (
                  <AttendanceStatusPicker
                    label={label}
                    options={DAY_STATUSES}
                    value={row.control as DayStatus | null}
                    disabled={pending}
                    onChange={(status) => onStatus(row.studentId, status)}
                  />
                ) : (
                  <AttendanceStatusPicker
                    label={label}
                    options={SHEET_STATUSES}
                    value={row.control as SheetStatus | null}
                    disabled={pending}
                    onChange={(status) => onStatus(row.studentId, status)}
                  />
                )}
                {row.control ? (
                  <AttendanceClearButton
                    disabled={pending}
                    onClear={() => onStatus(row.studentId, null)}
                  />
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
