import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { claimedInstructorUserIds, staffCanManageCourse, staffCanViewCourse } from "@/courses/model/access";
import { courseQueryKeys, getCourse, listCourseInstructors } from "@/courses/databridge/courses";
import { fillCycleQueryKeys, getFillCycle, submitFillPackage } from "@/grading/databridge/fillCycles";
import {
  listCoursePeriodFeedback,
  periodFeedbackQueryKeys,
  savePeriodFeedback,
} from "@/grading/databridge/periodFeedback";
import { periodFeedbackBody, periodFeedbackError } from "@/grading/model/periodFeedback";
import { enrollmentQueryKeys, listCourseEnrollments } from "@/roster/databridge/enrollments";

export function usePeriodFeedback() {
  const { courseId: courseIdParam } = useParams();
  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const requestedCycleId = Number(searchParams.get("cycle"));
  const enabled = Number.isFinite(courseId);

  const cycleQuery = useQuery({
    queryKey: fillCycleQueryKeys.detail(requestedCycleId),
    queryFn: () => getFillCycle(requestedCycleId),
    enabled: Number.isFinite(requestedCycleId),
  });
  const cycle =
    cycleQuery.data && cycleQuery.data.requirePeriodFeedback ? cycleQuery.data : null;
  const fillCycleId = cycle?.id ?? null;
  const cycleOpen = cycle?.status === "open";

  const courseQuery = useQuery({
    queryKey: courseQueryKeys.detail(courseId),
    queryFn: () => getCourse(courseId),
    enabled,
  });
  const instructorsQuery = useQuery({
    queryKey: courseQueryKeys.instructors(courseId),
    queryFn: () => listCourseInstructors(courseId),
    enabled,
  });
  const enrollmentsQuery = useQuery({
    queryKey: enrollmentQueryKeys.course(courseId),
    queryFn: () => listCourseEnrollments(courseId),
    enabled,
  });
  const feedbackQuery = useQuery({
    queryKey: periodFeedbackQueryKeys.course(courseId, fillCycleId ?? 0),
    queryFn: () => listCoursePeriodFeedback(courseId, fillCycleId ?? 0),
    enabled: enabled && fillCycleId != null,
  });

  const course = courseQuery.data ?? null;
  const sameOrg = course?.organizationId === organization.id;
  const accessReady = !courseQuery.isLoading && !instructorsQuery.isLoading;
  const access = {
    role,
    parentPresentation,
    userId: user.id,
    instructorUserIds: claimedInstructorUserIds(instructorsQuery.data ?? []),
  };
  const canView = Boolean(accessReady && sameOrg && staffCanViewCourse(access));
  const canEdit = Boolean(accessReady && sameOrg && staffCanManageCourse(access) && cycleOpen);

  function invalidate() {
    return Promise.all([
      queryClient.invalidateQueries({
        queryKey: periodFeedbackQueryKeys.course(courseId, fillCycleId ?? 0),
      }),
      queryClient.invalidateQueries({ queryKey: fillCycleQueryKeys.workspace(organization.id) }),
    ]);
  }

  const save = useMutation({
    mutationFn: (input: { studentId: number; raw: string }) => {
      if (!course || fillCycleId == null) throw new Error("Open this from an open fill cycle.");
      const message = periodFeedbackError(input.raw);
      if (message) throw new Error(message);
      const existing = (feedbackQuery.data ?? []).find((row) => row.studentId === input.studentId);
      return savePeriodFeedback({
        organizationId: course.organizationId,
        courseId,
        fillCycleId,
        studentId: input.studentId,
        body: periodFeedbackBody(input.raw),
        existingId: existing?.id ?? null,
      });
    },
    onSuccess: invalidate,
  });

  const submit = useMutation({
    mutationFn: () => {
      if (!course || fillCycleId == null) throw new Error("Open this from an open fill cycle.");
      return submitFillPackage({
        organizationId: course.organizationId,
        cycleId: fillCycleId,
        kind: "period_feedback",
        courseId,
        classId: null,
      });
    },
    onSuccess: invalidate,
  });

  const error =
    [courseQuery.error, instructorsQuery.error, enrollmentsQuery.error, feedbackQuery.error, cycleQuery.error, save.error, submit.error]
      .find((item) => item instanceof Error)?.message ?? null;

  const students = (enrollmentsQuery.data ?? [])
    .map((enrollment) => ({ id: enrollment.student.id, name: enrollment.student.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    organization,
    course: sameOrg ? course : null,
    loading:
      !enabled ||
      !accessReady ||
      cycleQuery.isLoading ||
      (canView && fillCycleId != null && (enrollmentsQuery.isLoading || feedbackQuery.isLoading)),
    notFound: enabled && accessReady && (!course || !sameOrg || !canView),
    missingCycle: accessReady && canView && fillCycleId == null && !cycleQuery.isLoading,
    canEdit,
    closed: cycle != null && !cycleOpen,
    cycleLabel: cycle?.label ?? null,
    students,
    feedback: feedbackQuery.data ?? [],
    saving: save.isPending,
    submitting: submit.isPending,
    error,
    saveStudent: (studentId: number, raw: string) => save.mutate({ studentId, raw }),
    submitPackage: () => submit.mutate(),
  };
}
