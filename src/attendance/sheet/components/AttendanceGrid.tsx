import { Link } from "react-router-dom";
import {
  SHEET_STATUSES,
  attendanceStatusLabel,
  partialReasonCopy,
  type DayBadgeStatus,
  type SheetStatus,
} from "@/attendance/model/daySummary";
import { Badge } from "@/ui/Badge";
import { AttendanceClearButton } from "./AttendanceClearButton";
import { AttendanceStatusPicker } from "./AttendanceStatusPicker";

export type AttendanceSheetLine = {
  key: string;
  title: string;
  status: SheetStatus;
  href: string | null;
};

export type AttendanceGridRow = {
  studentId: number;
  name: string;
  profileTo: string;
  sheetStatus: SheetStatus | null;
  badge: DayBadgeStatus | null;
  dayMark: boolean;
  partialReason: "disagree" | "incomplete" | null;
  lines: AttendanceSheetLine[];
  canWriteSheet: boolean;
  sheetPending: boolean;
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
}: {
  sheetLabel: string;
  rows: AttendanceGridRow[];
  onSheetStatus: (studentId: number, status: SheetStatus | null) => void;
}) {
  return (
    <ul className="divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
      {rows.map((row) => {
        const why = partialReasonCopy(row.partialReason);
        return (
          <li key={row.studentId} className="space-y-3 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                to={row.profileTo}
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
                  <li key={line.key} className="text-[13.5px] text-[var(--ink)]">
                    {line.href ? (
                      <Link
                        to={line.href}
                        className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
                      >
                        {line.title}
                      </Link>
                    ) : (
                      line.title
                    )}
                    {" · "}
                    {attendanceStatusLabel(line.status)}
                  </li>
                ))}
              </ul>
            ) : null}
            {row.canWriteSheet ? (
              <div className="flex flex-wrap items-end gap-2">
                <AttendanceStatusPicker
                  label={sheetLabel}
                  options={SHEET_STATUSES}
                  value={row.sheetStatus}
                  disabled={row.sheetPending}
                  onChange={(status) => onSheetStatus(row.studentId, status)}
                />
                {row.sheetStatus ? (
                  <AttendanceClearButton
                    disabled={row.sheetPending}
                    onClear={() => onSheetStatus(row.studentId, null)}
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-[13.5px] text-[var(--ink)]">
                <span className="font-bold text-[var(--ink-soft)]">{sheetLabel}. </span>
                {row.sheetStatus ? attendanceStatusLabel(row.sheetStatus) : "Not marked"}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
