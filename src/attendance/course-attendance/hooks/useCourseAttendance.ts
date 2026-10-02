import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  attendanceQueryKeys,
  deleteCourseEntry,
  loadCourseDateMarks,
  upsertCourseEntry,
  type OtherSheetMark,
} from "@/attendance/databridge/attendance";
import {
  mergeAttendanceGrid,
  parseIsoDate,
  summarizeDay,
  todayIso,
  type DayBadgeStatus,
  type SheetStatus,
} from "@/attendance/model/daySummary";
import { classAttendancePath, withAttendanceDate } from "@/attendance/model/paths";
import { claimedInstructorUserIds, staffCanManageCourse, staffCanViewCourse } from "@/courses/model/access";
import {
  courseQueryKeys,
  getCourse,
  listCourseInstructors,
} from "@/courses/databridge/courses";
import { enrollmentQueryKeys, listCourseEnrollments } from "@/roster/databridge/enrollments";
import { toastCaughtError } from "@/ui/toast";

function errorText(error: unknown): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : "Something went wrong.";
}

type UndoState = {
  message: string;
  writes: { studentId: number; status: SheetStatus | null }[];
};

export function useCourseAttendance() {
  const user = useAuthedUser();
  const { courseId: courseIdParam } = useParams();
  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const [searchParams, setSearchParams] = useSearchParams();
  const { organization, role, parentPresentation } = useOrgShell();
  const queryClient = useQueryClient();
  const dateParam = searchParams.get("date") ?? "";
  const [onDate, setOnDateState] = useState(
    parseIsoDate(dateParam) ? dateParam : todayIso(),
  );
  const [undo, setUndo] = useState<UndoState | null>(null);
  const courseReady = Number.isFinite(courseId);

  const courseQuery = useQuery({
    queryKey: courseQueryKeys.detail(courseId),
    queryFn: () => getCourse(courseId),
    enabled: courseReady,
  });
  const course = courseQuery.data ?? null;
  const belongs = course?.organizationId === organization.id;

  const instructorsQuery = useQuery({
    queryKey: courseQueryKeys.instructors(courseId),
    queryFn: () => listCourseInstructors(courseId),
    enabled: courseReady && belongs,
  });
  const instructorUserIds = claimedInstructorUserIds(instructorsQuery.data ?? []);
  const accessArgs = {
    role,
    parentPresentation,
    userId: user.id,
    instructorUserIds,
  };
  const canView = belongs && instructorsQuery.isSuccess && staffCanViewCourse(accessArgs);
  const canManage = belongs && instructorsQuery.isSuccess && staffCanManageCourse(accessArgs);

  const enrollmentsQuery = useQuery({
    queryKey: enrollmentQueryKeys.course(courseId),
    queryFn: () => listCourseEnrollments(courseId),
    enabled: canView,
  });
  const enrollments = enrollmentsQuery.data ?? [];
  const enrolledIds = enrollments.map((enrollment) => enrollment.student.id);
  const enrolledKey = [...enrolledIds].sort((a, b) => a - b).join(",");

  const marksQuery = useQuery({
    queryKey: [...attendanceQueryKeys.courseDate(courseId, onDate), enrolledKey],
    queryFn: () => loadCourseDateMarks({ courseId, onDate, enrolledIds }),
    enabled: canView && enrollmentsQuery.isSuccess,
  });

  const students = mergeAttendanceGrid(
    enrollments.map((enrollment) => ({
      id: enrollment.student.id,
      name: enrollment.student.name,
    })),
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

  const rows = students.map((student) => {
    const sheetStatus = entryByStudent.get(student.id) ?? null;
    const dayStatus = dayByStudent.get(student.id) ?? null;
    const others = othersByStudent.get(student.id) ?? [];
    const summary = summarizeDay({
      dayStatus,
      sheets: [
        ...(sheetStatus ? [{ status: sheetStatus, countsWhenBlank: false }] : []),
        ...others.map((other) => ({ status: other.status, countsWhenBlank: false })),
      ],
    });
    return {
      studentId: student.id,
      name: student.name,
      current: student.current,
      sheetStatus,
      badge: summary.badge as DayBadgeStatus | null,
      dayMark: summary.dayMark,
      partialReason: summary.partialReason,
      lines: others.map((other) => ({
        key: `${other.kind}-${other.sheetId}`,
        title: other.title,
        status: other.status,
        href:
          other.kind === "class"
            ? withAttendanceDate(
                classAttendancePath(organization.slug, other.sheetId),
                onDate,
              )
            : null,
      })),
      canWriteSheet: canManage && (student.current || sheetStatus != null),
    };
  });

  function refresh() {
    return queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all });
  }

  const sheetMutation = useMutation({
    mutationFn: async (writes: { studentId: number; status: SheetStatus | null }[]) => {
      if (!course) return;
      for (const write of writes) {
        if (write.status === null) {
          await deleteCourseEntry({
            courseId,
            studentProfileId: write.studentId,
            onDate,
          });
        } else {
          await upsertCourseEntry({
            organizationId: course.organizationId,
            courseId,
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

  function saveSheet(studentId: number, status: SheetStatus | null) {
    const row = rows.find((item) => item.studentId === studentId);
    if (!row || !row.canWriteSheet || row.sheetStatus === status) return;
    setUndo({
      message: status == null ? `Cleared ${row.name}.` : `Updated ${row.name}.`,
      writes: [{ studentId, status: row.sheetStatus }],
    });
    sheetMutation.mutate([{ studentId, status }]);
  }

  function markAllPresent() {
    const targets = rows.filter((row) => row.canWriteSheet && row.sheetStatus !== "present");
    if (targets.length === 0) return;
    const count = targets.length;
    setUndo({
      message: count === 1 ? "Marked 1 student present." : `Marked ${count} students present.`,
      writes: targets.map((row) => ({ studentId: row.studentId, status: row.sheetStatus })),
    });
    sheetMutation.mutate(targets.map((row) => ({ studentId: row.studentId, status: "present" as const })));
  }

  function undoLast() {
    if (!undo) return;
    const writes = undo.writes;
    setUndo(null);
    sheetMutation.mutate(writes);
  }

  const showMarkAll = rows.some((row) => row.canWriteSheet && row.sheetStatus !== "present");

  return {
    organization,
    courseId,
    course: belongs ? course : null,
    onDate,
    setOnDate,
    rows,
    canView,
    canManage,
    showMarkAll,
    undo,
    undoLast,
    loading:
      courseQuery.isLoading ||
      (belongs &&
        (instructorsQuery.isLoading ||
          (canView && (enrollmentsQuery.isLoading || marksQuery.isLoading)))),
    notFound:
      courseReady &&
      !courseQuery.isLoading &&
      (!course || !belongs || (instructorsQuery.isSuccess && !canView)),
    error: errorText(
      courseQuery.error ??
        instructorsQuery.error ??
        enrollmentsQuery.error ??
        marksQuery.error,
    ),
    saveSheet,
    markAllPresent,
    pending: sheetMutation.isPending,
  };
}
