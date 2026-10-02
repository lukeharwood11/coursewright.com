export const SHEET_STATUSES = ["present", "absent", "late", "excused"] as const;
export type SheetStatus = (typeof SHEET_STATUSES)[number];

export const DAY_STATUSES = ["present", "absent", "excused", "partial"] as const;
export type DayStatus = (typeof DAY_STATUSES)[number];

/** Day-row statuses plus Late, which only comes from agreeing sheet rows. */
export type DayBadgeStatus = DayStatus | "late";

export type GridStudent = {
  id: number;
  name: string;
  current: boolean;
};

const SHEET_STATUS_SET = new Set<string>(SHEET_STATUSES);
const DAY_STATUS_SET = new Set<string>(DAY_STATUSES);

export function parseSheetStatus(value: string): SheetStatus | null {
  return SHEET_STATUS_SET.has(value) ? (value as SheetStatus) : null;
}

export function parseDayStatus(value: string): DayStatus | null {
  return DAY_STATUS_SET.has(value) ? (value as DayStatus) : null;
}

export function attendanceStatusLabel(status: string): string {
  switch (status) {
    case "present":
      return "Present";
    case "absent":
      return "Absent";
    case "late":
      return "Late";
    case "excused":
      return "Excused";
    case "partial":
      return "Partial";
    default:
      return status;
  }
}

export type DaySummary = {
  badge: DayBadgeStatus | null;
  /** An explicit day row is the badge. */
  dayMark: boolean;
  /** Why the badge is Partial. Null when it is not Partial from sheets. */
  partialReason: "disagree" | "incomplete" | null;
};

export type SummarySheet = {
  status: SheetStatus | null;
  /** Unmarked sheet still counts (a course tied to this class the student takes). */
  countsWhenBlank: boolean;
};

/**
 * Day summary badge.
 * An explicit day row wins. Otherwise a blank expected sheet beside any mark
 * is Partial (incomplete). Disagreeing marks are Partial. Agreeing marks,
 * including a single sheet and Late, use that status. No marks means no badge.
 */
export function summarizeDay(input: {
  dayStatus: DayStatus | null;
  sheets: readonly SummarySheet[];
}): DaySummary {
  if (input.dayStatus) {
    return { badge: input.dayStatus, dayMark: true, partialReason: null };
  }
  const marked = input.sheets.flatMap((sheet) => (sheet.status ? [sheet.status] : []));
  if (marked.length === 0) {
    return { badge: null, dayMark: false, partialReason: null };
  }
  const first = marked[0];
  if (!first) return { badge: null, dayMark: false, partialReason: null };
  if (!marked.every((status) => status === first)) {
    return { badge: "partial", dayMark: false, partialReason: "disagree" };
  }
  const unmarkedExpected = input.sheets.some(
    (sheet) => sheet.countsWhenBlank && sheet.status == null,
  );
  if (unmarkedExpected) {
    return { badge: "partial", dayMark: false, partialReason: "incomplete" };
  }
  return { badge: first, dayMark: false, partialReason: null };
}

export function dayBadge(input: {
  dayStatus: DayStatus | null;
  sheetStatuses: readonly SheetStatus[];
}): DayBadgeStatus | null {
  return summarizeDay({
    dayStatus: input.dayStatus,
    sheets: input.sheetStatuses.map((status) => ({
      status,
      countsWhenBlank: false,
    })),
  }).badge;
}

export function partialReasonCopy(
  reason: DaySummary["partialReason"],
): string | null {
  if (reason === "disagree") return "Sheets don’t agree.";
  if (reason === "incomplete") return "Some sheets for this day are still open.";
  return null;
}

export function classAttendanceHelp(input: {
  canWrite: boolean;
  scope: "day" | "class" | "course";
}): string {
  if (!input.canWrite) {
    return "You’re viewing attendance for this class. You can’t change it.";
  }
  if (input.scope === "day") {
    return "Mark the day for this class. A day mark is the summary for that student. Clear removes it.";
  }
  if (input.scope === "class") {
    return "This class sheet is separate from the day. The badge beside each name is still the one day summary.";
  }
  return "Correct this course for students in the class. The badge beside each name is still the one day summary.";
}

export function courseAttendanceHelp(canWrite: boolean): string {
  if (!canWrite) return "You’re viewing this course sheet. You can’t change it.";
  return "This is the course sheet. Clear removes a mark. A day mark, when one is set, is the summary and does not change this sheet.";
}

export function mergeAttendanceGrid(
  current: readonly { id: number; name: string }[],
  marked: readonly { id: number; name: string }[],
): GridStudent[] {
  const byId = new Map<number, GridStudent>();
  for (const student of current) {
    byId.set(student.id, { id: student.id, name: student.name, current: true });
  }
  for (const student of marked) {
    if (byId.has(student.id)) continue;
    byId.set(student.id, { id: student.id, name: student.name, current: false });
  }
  return [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export function todayIso(now = new Date()): string {
  return isoDate(now);
}

export function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Inclusive local dates, oldest first, ending on `endIso`. */
export function attendanceWindow(endIso: string, days = 14): string[] {
  const end = parseIsoDate(endIso);
  if (!end) return [];
  const dates: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(end);
    date.setDate(end.getDate() - offset);
    dates.push(isoDate(date));
  }
  return dates;
}

export function formatAttendanceDate(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export type StudentSheetMark = {
  onDate: string;
  title: string;
  status: SheetStatus;
};

export type StudentDayRecord = {
  onDate: string;
  status: DayStatus;
};

export type StudentDayView = {
  onDate: string;
  dayStatus: DayStatus | null;
  badge: DayBadgeStatus | null;
  sheets: { title: string; status: SheetStatus }[];
};

export function studentAttendanceDays(input: {
  dates: readonly string[];
  days: readonly StudentDayRecord[];
  marks: readonly StudentSheetMark[];
  includeEmpty: boolean;
  /** Keep these dates even when nothing is marked (staff profile pins the chosen day). */
  pinDates?: readonly string[];
}): StudentDayView[] {
  const dayByDate = new Map(input.days.map((day) => [day.onDate, day.status]));
  const marksByDate = new Map<string, StudentSheetMark[]>();
  for (const mark of input.marks) {
    const list = marksByDate.get(mark.onDate) ?? [];
    list.push(mark);
    marksByDate.set(mark.onDate, list);
  }

  const views: StudentDayView[] = [];
  for (const onDate of [...input.dates].reverse()) {
    const sheets = (marksByDate.get(onDate) ?? [])
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))
      .map((mark) => ({ title: mark.title, status: mark.status }));
    const dayStatus = dayByDate.get(onDate) ?? null;
    const badge = dayBadge({
      dayStatus,
      sheetStatuses: sheets.map((sheet) => sheet.status),
    });
    const pinned = input.pinDates?.includes(onDate) ?? false;
    if (!input.includeEmpty && !pinned && !badge && sheets.length === 0) continue;
    views.push({ onDate, dayStatus, badge, sheets });
  }
  return views;
}

export function canWriteClassSheet(input: {
  isOrgAdmin: boolean;
  isClassLead: boolean;
}): boolean {
  return input.isOrgAdmin || input.isClassLead;
}

export function canWriteClassDay(input: {
  isOrgAdmin: boolean;
  isClassLead: boolean;
  currentMember: boolean;
}): boolean {
  return input.isOrgAdmin || (input.isClassLead && input.currentMember);
}

export function canWriteCourseDay(input: {
  isOrgAdmin: boolean;
  canManageCourse: boolean;
  activeEnrollment: boolean;
}): boolean {
  return input.isOrgAdmin || (input.canManageCourse && input.activeEnrollment);
}

export function canWriteStudentDay(input: {
  isOrgAdmin: boolean;
  leadsCurrentClass: boolean;
  teachesActiveEnrollment: boolean;
}): boolean {
  return input.isOrgAdmin || input.leadsCurrentClass || input.teachesActiveEnrollment;
}
