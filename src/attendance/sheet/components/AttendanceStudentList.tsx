import { Link } from "react-router-dom";
import { attendanceStatusLabel } from "@/attendance/model/daySummary";
import { Badge } from "@/ui/Badge";
import { AttendanceClearButton } from "./AttendanceClearButton";
import { AttendanceStatusPicker } from "./AttendanceStatusPicker";

export type AttendanceStudentRow<T extends string> = {
  studentId: number;
  name: string;
  profileTo: string;
  status: T | null;
  canWrite: boolean;
  dayFooter: string | null;
};

function badgeVariant(status: string): "green" | "amber" | "slate" {
  if (status === "present") return "green";
  if (status === "absent" || status === "late") return "amber";
  return "slate";
}

export function AttendanceStudentList<T extends string>({
  rows,
  options,
  pending,
  ariaLabel,
  onStatus,
}: {
  rows: AttendanceStudentRow<T>[];
  options: readonly T[];
  pending: boolean;
  ariaLabel: string;
  onStatus: (studentId: number, status: T | null) => void;
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
            {!row.canWrite ? (
              row.status ? (
                <Badge variant={badgeVariant(row.status)}>
                  {attendanceStatusLabel(row.status)}
                </Badge>
              ) : (
                <span className="text-[12px] font-bold text-[var(--ink-soft)]">Not marked</span>
              )
            ) : null}
          </div>
          {row.canWrite ? (
            <div className="space-y-2">
              <AttendanceStatusPicker
                label={ariaLabel}
                options={options}
                value={row.status}
                disabled={pending}
                onChange={(status) => onStatus(row.studentId, status)}
              />
              {row.status ? (
                <AttendanceClearButton
                  disabled={pending}
                  onClear={() => onStatus(row.studentId, null)}
                />
              ) : null}
            </div>
          ) : null}
          {row.dayFooter ? (
            <p className="text-[12px] text-[var(--ink-soft)]">{row.dayFooter}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
