import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  attendanceQueryKeys,
  deleteClassEntry,
  deleteCourseEntry,
  deleteDay,
  loadClassCohortCourses,
  loadClassDateMarks,
  upsertClassEntry,
  upsertCourseEntry,
  upsertDay,
  type OtherSheetMark,
} from "@/attendance/databridge/attendance";
import {
  canWriteClassDay,
  canWriteClassSheet,
  mergeAttendanceGrid,
  parseIsoDate,
  summarizeDay,
  todayIso,
  type DayBadgeStatus,
  type DayStatus,
  type SheetStatus,
} from "@/attendance/model/daySummary";
import {
  classAttendancePath,
  courseAttendancePath,
  withAttendanceDate,
} from "@/attendance/model/paths";
import { browsesAsStaff, canManageOrgSettings } from "@/organizations/model/role";
import {
  classQueryKeys,
  getClass,
  listClassLeaders,
  listClassMembers,
} from "@/roster/databridge/classes";
import { toastCaughtError } from "@/ui/toast";

function errorText(error: unknown): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : "Something went wrong.";
}

export type ClassAttendanceScope =
  | { kind: "day" }
  | { kind: "class" }
  | { kind: "course"; courseId: number };

export type ClassSheetLine = {
  key: string;
  title: string;
  status: SheetStatus | null;
  href: string | null;
  correctScope: string | null;
};

export type ClassAttendanceRow = {
  studentId: number;
  name: string;
  current: boolean;
  badge: DayBadgeStatus | null;
  dayMark: boolean;
  partialReason: "disagree" | "incomplete" | null;
  lines: ClassSheetLine[];
  control: SheetStatus | DayStatus | null;
  canWrite: boolean;
};

type Write =
  | { studentId: number; scope: "day"; status: DayStatus | null }
  | { studentId: number; scope: "class"; status: SheetStatus | null }
  | { studentId: number; scope: "course"; courseId: number; status: SheetStatus | null };

export type AttendanceUndo = {
  message: string;
  writes: Write[];
};

function scopeKey(scope: ClassAttendanceScope): string {
  if (scope.kind === "course") return `course:${scope.courseId}`;
  return scope.kind;
}

function parseScope(value: string): ClassAttendanceScope {
  if (value === "class") return { kind: "class" };
  if (value.startsWith("course:")) {
    const courseId = Number(value.slice("course:".length));
    if (Number.isFinite(courseId)) return { kind: "course", courseId };
  }
  return { kind: "day" };
}

export function useClassAttendance() {
  const user = useAuthedUser();
  const { classId: classIdParam } = useParams();
  const classId = classIdParam ? Number(classIdParam) : NaN;
  const [searchParams, setSearchParams] = useSearchParams();
  const { organization, role, parentPresentation } = useOrgShell();
  const queryClient = useQueryClient();
  const dateParam = searchParams.get("date") ?? "";
  const [onDate, setOnDateState] = useState(
    parseIsoDate(dateParam) ? dateParam : todayIso(),
  );
  const [scopeValue, setScopeValue] = useState("day");
  const [undo, setUndo] = useState<AttendanceUndo | null>(null);
  const classReady = Number.isFinite(classId);
  const isOrgAdmin = Boolean(role && canManageOrgSettings(role));
  const isObserver = role === "observer";
  const staffBrowse = Boolean(role && browsesAsStaff(role) && !parentPresentation);
  const scope = parseScope(scopeValue);

  const classQuery = useQuery({
    queryKey: classQueryKeys.detail(classId),
    queryFn: () => getClass(classId),
    enabled: classReady,
  });
  const classGroup = classQuery.data ?? null;
  const belongs = classGroup?.organizationId === organization.id;

  const membersQuery = useQuery({
    queryKey: classQueryKeys.members(classId),
    queryFn: () => listClassMembers(classId),
    enabled: classReady && belongs && staffBrowse,
  });
  const leadersQuery = useQuery({
    queryKey: classQueryKeys.leaders(classId),
    queryFn: () => listClassLeaders(classId),
    enabled: classReady && belongs && staffBrowse,
  });

  const members = membersQuery.data ?? [];
  const memberIds = members.map((member) => member.student.id);
  const memberKey = [...memberIds].sort((a, b) => a - b).join(",");

  const marksQuery = useQuery({
    queryKey: [...attendanceQueryKeys.classDate(classId, onDate), memberKey],
    queryFn: async () => {
      const marks = await loadClassDateMarks({ classId, onDate, memberIds });
      const cohort = await loadClassCohortCourses(memberIds);
      return { ...marks, ...cohort };
    },
    enabled: classReady && belongs && staffBrowse && membersQuery.isSuccess,
  });

  const isClassLead = (leadersQuery.data ?? []).some((lead) => lead.userId === user.id);
  const writeClass = canWriteClassSheet({ isOrgAdmin, isClassLead });
  const slug = organization.slug;

  const instructorsByCourse = new Map<number, string[]>();
  for (const instructor of marksQuery.data?.instructors ?? []) {
    const list = instructorsByCourse.get(instructor.courseId) ?? [];
    if (instructor.userId) list.push(instructor.userId);
    instructorsByCourse.set(instructor.courseId, list);
  }

  function canManageCourse(courseId: number): boolean {
    if (!role || parentPresentation || role === "observer") return false;
    if (isOrgAdmin) return true;
    return (instructorsByCourse.get(courseId) ?? []).includes(user.id);
  }

  function canViewCourse(courseId: number): boolean {
    if (isObserver) return true;
    return canManageCourse(courseId);
  }

  const courseTitleById = new Map<number, string>();
  const enrolledByStudent = new Map<number, { courseId: number; title: string }[]>();
  for (const enrollment of marksQuery.data?.enrollments ?? []) {
    courseTitleById.set(enrollment.courseId, enrollment.title);
    const list = enrolledByStudent.get(enrollment.studentId) ?? [];
    list.push({ courseId: enrollment.courseId, title: enrollment.title });
    enrolledByStudent.set(enrollment.studentId, list);
  }

  const courseOptions = [...courseTitleById.entries()]
    .filter(([courseId]) => canManageCourse(courseId))
    .map(([courseId, title]) => ({ courseId, title }))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));

  const students = mergeAttendanceGrid(
    members.map((member) => ({ id: member.student.id, name: member.student.name })),
    (marksQuery.data?.entries ?? []).map((entry) => ({
      id: entry.studentId,
      name: entry.name,
    })),
  );

  const entryByStudent = new Map(
    (marksQuery.data?.entries ?? []).map((entry) => [entry.studentId, entry.status]),
  );
  const dayByStudent = new Map(
    (marksQuery.data?.days ?? []).map((day) => [day.studentId, day.status]),
  );
  const othersByStudent = new Map<number, OtherSheetMark[]>();
  for (const other of marksQuery.data?.others ?? []) {
    const list = othersByStudent.get(other.studentId) ?? [];
    list.push(other);
    othersByStudent.set(other.studentId, list);
  }
  const courseMarkByStudent = new Map<number, Map<number, SheetStatus>>();
  for (const other of marksQuery.data?.others ?? []) {
    if (other.kind !== "course") continue;
    const byCourse = courseMarkByStudent.get(other.studentId) ?? new Map();
    byCourse.set(other.sheetId, other.status);
    courseMarkByStudent.set(other.studentId, byCourse);
  }

  const rows: ClassAttendanceRow[] = students.flatMap((student) => {
    const sheetStatus = entryByStudent.get(student.id) ?? null;
    const dayStatus = dayByStudent.get(student.id) ?? null;
    const enrolled = enrolledByStudent.get(student.id) ?? [];
    const courseMarks = courseMarkByStudent.get(student.id) ?? new Map();
    const others = othersByStudent.get(student.id) ?? [];

    if (scope.kind === "course") {
      const enrolledHere = enrolled.some((course) => course.courseId === scope.courseId);
      const markedHere = courseMarks.has(scope.courseId);
      if (!enrolledHere && !markedHere) return [];
    }

    const summarySheets = [
      {
        status: sheetStatus,
        countsWhenBlank: false,
      },
      ...others
        .filter((other) => other.kind === "class")
        .map((other) => ({ status: other.status, countsWhenBlank: false })),
      ...enrolled.map((course) => ({
        status: courseMarks.get(course.courseId) ?? null,
        countsWhenBlank: true,
      })),
      ...others
        .filter(
          (other) =>
            other.kind === "course" &&
            !enrolled.some((course) => course.courseId === other.sheetId),
        )
        .map((other) => ({ status: other.status, countsWhenBlank: false })),
    ];
    const summary = summarizeDay({ dayStatus, sheets: summarySheets });

    const lineSheets: ClassSheetLine[] = [];
    lineSheets.push({
      key: `class-${classId}`,
      title: classGroup?.title ?? "This class",
      status: sheetStatus,
      href: null,
      correctScope: writeClass && (student.current || sheetStatus) ? "class" : null,
    });
    for (const other of others.filter((mark) => mark.kind === "class")) {
      lineSheets.push({
        key: `class-${other.sheetId}`,
        title: other.title,
        status: other.status,
        href: withAttendanceDate(classAttendancePath(slug, other.sheetId), onDate),
        correctScope: null,
      });
    }
    const courseIds = new Set<number>([
      ...enrolled.map((course) => course.courseId),
      ...others.filter((mark) => mark.kind === "course").map((mark) => mark.sheetId),
    ]);
    for (const courseId of courseIds) {
      const title =
        courseTitleById.get(courseId) ??
        others.find((mark) => mark.kind === "course" && mark.sheetId === courseId)?.title ??
        "Course";
      const status = courseMarks.get(courseId) ?? null;
      const manageable = canManageCourse(courseId);
      lineSheets.push({
        key: `course-${courseId}`,
        title,
        status,
        href: canViewCourse(courseId)
          ? withAttendanceDate(courseAttendancePath(slug, courseId), onDate)
          : null,
        correctScope:
          manageable && (enrolled.some((course) => course.courseId === courseId) || status)
            ? `course:${courseId}`
            : null,
      });
    }
    lineSheets.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
    const lines = lineSheets.filter((line) => {
      if (line.status != null) return true;
      return summary.partialReason != null && line.key.startsWith("course-");
    });

    let control: SheetStatus | DayStatus | null = null;
    let canWrite = false;
    if (scope.kind === "day") {
      control = dayStatus;
      canWrite = canWriteClassDay({
        isOrgAdmin,
        isClassLead,
        currentMember: student.current,
      });
    } else if (scope.kind === "class") {
      control = sheetStatus;
      canWrite = writeClass && (student.current || sheetStatus != null);
    } else {
      control = courseMarks.get(scope.courseId) ?? null;
      const active = enrolled.some((course) => course.courseId === scope.courseId);
      canWrite = canManageCourse(scope.courseId) && (active || control != null);
    }

    return [
      {
        studentId: student.id,
        name: student.name,
        current: student.current,
        badge: summary.badge,
        dayMark: summary.dayMark,
        partialReason: summary.partialReason,
        lines,
        control,
        canWrite,
      },
    ];
  });

  function refresh() {
    return queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all });
  }

  const saveMutation = useMutation({
    mutationFn: async (writes: Write[]) => {
      if (!classGroup) return;
      for (const write of writes) {
        if (write.scope === "day") {
          if (write.status === null) {
            await deleteDay({ studentProfileId: write.studentId, onDate });
          } else {
            await upsertDay({
              organizationId: classGroup.organizationId,
              studentProfileId: write.studentId,
              onDate,
              status: write.status,
            });
          }
        } else if (write.scope === "class") {
          if (write.status === null) {
            await deleteClassEntry({
              classId,
              studentProfileId: write.studentId,
              onDate,
            });
          } else {
            await upsertClassEntry({
              organizationId: classGroup.organizationId,
              classId,
              studentProfileId: write.studentId,
              onDate,
              status: write.status,
            });
          }
        } else if (write.status === null) {
          await deleteCourseEntry({
            courseId: write.courseId,
            studentProfileId: write.studentId,
            onDate,
          });
        } else {
          await upsertCourseEntry({
            organizationId: classGroup.organizationId,
            courseId: write.courseId,
            studentProfileId: write.studentId,
            onDate,
            status: write.status,
          });
        }
      }
    },
    onSuccess: refresh,
    onError: (error) => toastCaughtError(error),
  });

  function setOnDate(value: string) {
    setOnDateState(value);
    setUndo(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("date", value);
        return next;
      },
      { replace: true },
    );
  }

  function setScope(value: string) {
    setScopeValue(value);
    setUndo(null);
  }

  function remember(message: string, writes: Write[]) {
    setUndo(writes.length > 0 ? { message, writes } : null);
  }

  function saveOne(studentId: number, status: DayStatus | SheetStatus | null) {
    const row = rows.find((item) => item.studentId === studentId);
    if (!row || !row.canWrite || row.control === status) return;
    const previous = row.control;
    let write: Write;
    let undoWrite: Write;
    if (scope.kind === "day") {
      write = { studentId, scope: "day", status: status as DayStatus | null };
      undoWrite = { studentId, scope: "day", status: previous as DayStatus | null };
    } else if (scope.kind === "class") {
      write = { studentId, scope: "class", status: status as SheetStatus | null };
      undoWrite = { studentId, scope: "class", status: previous as SheetStatus | null };
    } else {
      write = {
        studentId,
        scope: "course",
        courseId: scope.courseId,
        status: status as SheetStatus | null,
      };
      undoWrite = {
        studentId,
        scope: "course",
        courseId: scope.courseId,
        status: previous as SheetStatus | null,
      };
    }
    const name = row.name;
    remember(status == null ? `Cleared ${name}.` : `Updated ${name}.`, [undoWrite]);
    saveMutation.mutate([write]);
  }

  function markAllPresent() {
    const targets = rows.filter((row) => row.canWrite && row.control !== "present");
    if (targets.length === 0) return;
    const writes: Write[] = [];
    const undoWrites: Write[] = [];
    for (const row of targets) {
      if (scope.kind === "day") {
        writes.push({ studentId: row.studentId, scope: "day", status: "present" });
        undoWrites.push({
          studentId: row.studentId,
          scope: "day",
          status: row.control as DayStatus | null,
        });
      } else if (scope.kind === "class") {
        writes.push({ studentId: row.studentId, scope: "class", status: "present" });
        undoWrites.push({
          studentId: row.studentId,
          scope: "class",
          status: row.control as SheetStatus | null,
        });
      } else {
        writes.push({
          studentId: row.studentId,
          scope: "course",
          courseId: scope.courseId,
          status: "present",
        });
        undoWrites.push({
          studentId: row.studentId,
          scope: "course",
          courseId: scope.courseId,
          status: row.control as SheetStatus | null,
        });
      }
    }
    const count = targets.length;
    remember(
      count === 1 ? "Marked 1 student present." : `Marked ${count} students present.`,
      undoWrites,
    );
    saveMutation.mutate(writes);
  }

  function undoLast() {
    if (!undo) return;
    const writes = undo.writes;
    setUndo(null);
    saveMutation.mutate(writes);
  }

  const canWriteAny = rows.some((row) => row.canWrite);
  const showMarkAll = canWriteAny && rows.some((row) => row.canWrite && row.control !== "present");
  const recordingOptions: { value: string; label: string }[] = [];
  if (writeClass || isClassLead || isOrgAdmin || courseOptions.length > 0) {
    recordingOptions.push({ value: "day", label: "Day" });
    if (writeClass) recordingOptions.push({ value: "class", label: "This class" });
    for (const course of courseOptions) {
      recordingOptions.push({ value: `course:${course.courseId}`, label: course.title });
    }
  }

  return {
    organization,
    classId,
    classGroup: belongs ? classGroup : null,
    onDate,
    setOnDate,
    scope,
    scopeValue: scopeKey(scope),
    setScope,
    recordingOptions,
    rows,
    staffBrowse,
    roleReady: role != null,
    canWriteAny,
    showMarkAll,
    undo,
    undoLast,
    loading:
      !role ||
      classQuery.isLoading ||
      (staffBrowse && belongs && (membersQuery.isLoading || marksQuery.isLoading)),
    notFound: classReady && !classQuery.isLoading && (!classGroup || !belongs),
    error: errorText(
      classQuery.error ?? membersQuery.error ?? leadersQuery.error ?? marksQuery.error,
    ),
    saveOne,
    markAllPresent,
    pending: saveMutation.isPending,
  };
}
