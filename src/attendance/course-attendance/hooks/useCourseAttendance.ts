import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  attendanceQueryKeys,
  deleteCourseEntry,
  loadCourseDateMarks,
  upsertCourseEntry,
} from "@/attendance/databridge/attendance";
import {
  attendancePageCount,
  attendanceRangeLabel,
  clampAttendancePage,
  dayFooterForMark,
  mergeAttendanceGrid,
  paginateAttendance,
  parseIsoDate,
  todayIso,
  type SheetStatus,
} from "@/attendance/model/daySummary";
import { orgContactsByUserId } from "@/organizations/databridge/orgNames";
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
  const [page, setPage] = useState(1);
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
  const days = marksQuery.data?.days ?? [];
  const dayByStudent = new Map(days.map((day) => [day.studentId, day]));
  const recorderIds = days.map((day) => day.recordedBy);
  const recorderKey = [...new Set(recorderIds.filter((id): id is string => Boolean(id)))]
    .sort()
    .join(",");
  const recordersQuery = useQuery({
    queryKey: ["attendance", "recorders", organization.id, recorderKey],
    queryFn: () => orgContactsByUserId(organization.id, recorderIds),
    enabled: recorderKey.length > 0,
  });
  const recorderNames =
    recorderKey.length === 0 || recordersQuery.isError
      ? new Map<string, string>()
      : recordersQuery.isSuccess
        ? new Map(
            [...recordersQuery.data.entries()].map(([id, contact]) => [id, contact.name]),
          )
        : null;

  const rows = students.map((student) => {
    const sheetStatus = entryByStudent.get(student.id) ?? null;
    const day = dayByStudent.get(student.id);
    return {
      studentId: student.id,
      name: student.name,
      current: student.current,
      sheetStatus,
      dayFooter: dayFooterForMark(day, recorderNames),
      canWriteSheet: canManage && (student.current || sheetStatus != null),
    };
  });

  const pageCount = attendancePageCount(rows.length);
  const safePage = clampAttendancePage(page, rows.length);
  const pageRows = paginateAttendance(rows, safePage);

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
    setPage(1);
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

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  return {
    organization,
    courseId,
    course: belongs ? course : null,
    onDate,
    setOnDate,
    rows,
    pageRows,
    page: safePage,
    pageCount,
    rangeLabel: attendanceRangeLabel(rows.length, safePage),
    canPrev: safePage > 1,
    canNext: safePage < pageCount,
    setPage,
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
