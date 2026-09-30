import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  attendanceQueryKeys,
  deleteCourseEntry,
  deleteDay,
  loadCourseDateMarks,
  upsertCourseEntry,
  upsertDay,
} from "@/attendance/databridge/attendance";
import {
  canWriteCourseDay,
  dayBadge,
  mergeAttendanceGrid,
  otherSheetHint,
  todayIso,
  type DayStatus,
  type SheetStatus,
} from "@/attendance/model/daySummary";
import { claimedInstructorUserIds, staffCanManageCourse, staffCanViewCourse } from "@/courses/model/access";
import {
  courseQueryKeys,
  getCourse,
  listCourseInstructors,
} from "@/courses/databridge/courses";
import { canManageOrgSettings } from "@/organizations/model/role";
import { enrollmentQueryKeys, listCourseEnrollments } from "@/roster/databridge/enrollments";
import { toastCaughtError } from "@/ui/toast";

function errorText(error: unknown): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function useCourseAttendance() {
  const user = useAuthedUser();
  const { courseId: courseIdParam } = useParams();
  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const queryClient = useQueryClient();
  const [onDate, setOnDate] = useState(todayIso);
  const courseReady = Number.isFinite(courseId);
  const isOrgAdmin = Boolean(role && canManageOrgSettings(role));

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
  const othersByStudent = new Map<number, { title: string; status: SheetStatus }[]>();
  for (const other of marksQuery.data?.others ?? []) {
    const list = othersByStudent.get(other.studentId) ?? [];
    list.push({ title: other.title, status: other.status });
    othersByStudent.set(other.studentId, list);
  }

  const rows = students.map((student) => {
    const sheetStatus = entryByStudent.get(student.id) ?? null;
    const dayStatus = dayByStudent.get(student.id) ?? null;
    const others = othersByStudent.get(student.id) ?? [];
    return {
      studentId: student.id,
      name: student.name,
      sheetStatus,
      dayStatus,
      badge: dayBadge({
        dayStatus,
        sheetStatuses: [
          ...(sheetStatus ? [sheetStatus] : []),
          ...others.map((other) => other.status),
        ],
      }),
      hint: otherSheetHint(others),
      canWriteSheet: canManage,
      canWriteDay: canWriteCourseDay({
        isOrgAdmin,
        canManageCourse: canManage,
        activeEnrollment: student.current,
      }),
    };
  });

  function refresh() {
    return queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all });
  }

  const sheetMutation = useMutation({
    mutationFn: async (input: { studentId: number; status: SheetStatus | null }) => {
      if (!course) return;
      if (input.status === null) {
        await deleteCourseEntry({
          courseId,
          studentProfileId: input.studentId,
          onDate,
        });
        return;
      }
      await upsertCourseEntry({
        organizationId: course.organizationId,
        courseId,
        studentProfileId: input.studentId,
        onDate,
        status: input.status,
      });
    },
    onSuccess: refresh,
    onError: (error) => toastCaughtError(error),
  });

  const dayMutation = useMutation({
    mutationFn: async (input: { studentId: number; status: DayStatus | null }) => {
      if (!course) return;
      if (input.status === null) {
        await deleteDay({ studentProfileId: input.studentId, onDate });
        return;
      }
      await upsertDay({
        organizationId: course.organizationId,
        studentProfileId: input.studentId,
        onDate,
        status: input.status,
      });
    },
    onSuccess: refresh,
    onError: (error) => toastCaughtError(error),
  });

  return {
    organization,
    courseId,
    course: belongs ? course : null,
    onDate,
    setOnDate,
    rows,
    canView,
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
    saveSheet: (studentId: number, status: SheetStatus | null) =>
      sheetMutation.mutate({ studentId, status }),
    saveDay: (studentId: number, status: DayStatus | null) =>
      dayMutation.mutate({ studentId, status }),
    pendingSheetId: sheetMutation.isPending ? sheetMutation.variables?.studentId : null,
    pendingDayId: dayMutation.isPending ? dayMutation.variables?.studentId : null,
  };
}
