import { Link } from "react-router-dom";
import {
  DAY_STATUSES,
  SHEET_STATUSES,
  attendanceStatusLabel,
  type DayBadgeStatus,
  type DayStatus,
  type SheetStatus,
} from "@/attendance/model/daySummary";
import { Badge } from "@/ui/Badge";
import { AttendanceStatusPicker } from "./AttendanceStatusPicker";

export type AttendanceGridRow = {
  studentId: number;
  name: string;
  profileTo: string;
  sheetStatus: SheetStatus | null;
  dayStatus: DayStatus | null;
  badge: DayBadgeStatus | null;
  hint: string | null;
  canWriteSheet: boolean;
  canWriteDay: boolean;
  sheetPending: boolean;
  dayPending: boolean;
};

function badgeVariant(status: DayBadgeStatus): "green" | "amber" | "slate" {
  if (status === "present") return "green";
  if (status === "absent" || status === "late") return "amber";
  return "slate";
}

export function AttendanceGrid({
  sheetLabel,
  rows,
  onSheetStatus,
  onDayStatus,
}: {
  sheetLabel: string;
  rows: AttendanceGridRow[];
  onSheetStatus: (studentId: number, status: SheetStatus | null) => void;
  onDayStatus: (studentId: number, status: DayStatus | null) => void;
}) {
  return (
    <ul className="divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
      {rows.map((row) => (
        <li key={row.studentId} className="space-y-3 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              to={row.profileTo}
              className="text-[15px] font-extrabold text-[var(--ink)] hover:text-[var(--green-deep)]"
            >
              {row.name}
            </Link>
            {row.badge ? (
              <Badge variant={badgeVariant(row.badge)}>
                {attendanceStatusLabel(row.badge)}
              </Badge>
            ) : (
              <span className="text-[12px] font-bold text-[var(--ink-soft)]">Not marked</span>
            )}
          </div>
          {row.hint ? (
            <p className="text-[13px] text-[var(--ink-soft)]">{row.hint}</p>
          ) : null}
          {row.canWriteSheet ? (
            <AttendanceStatusPicker
              label={sheetLabel}
              options={SHEET_STATUSES}
              value={row.sheetStatus}
              disabled={row.sheetPending}
              onChange={(status) => onSheetStatus(row.studentId, status)}
            />
          ) : (
            <p className="text-[13.5px] text-[var(--ink)]">
              <span className="font-bold text-[var(--ink-soft)]">{sheetLabel}. </span>
              {row.sheetStatus ? attendanceStatusLabel(row.sheetStatus) : "Not marked"}
            </p>
          )}
          {row.canWriteDay ? (
            <AttendanceStatusPicker
              label="Day"
              options={DAY_STATUSES}
              value={row.dayStatus}
              disabled={row.dayPending}
              onChange={(status) => onDayStatus(row.studentId, status)}
            />
          ) : (
            <p className="text-[13.5px] text-[var(--ink)]">
              <span className="font-bold text-[var(--ink-soft)]">Day. </span>
              {row.dayStatus ? attendanceStatusLabel(row.dayStatus) : "Not marked"}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
