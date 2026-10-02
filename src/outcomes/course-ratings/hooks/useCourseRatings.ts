import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { claimedInstructorUserIds, staffCanManageCourse, staffCanViewCourse } from "@/courses/model/access";
import { courseQueryKeys, getCourse, listCourseInstructors } from "@/courses/databridge/courses";
import { listRatingOptions, listCourseOutcomes, outcomeQueryKeys } from "@/outcomes/databridge/outcomes";
import {
  listCourseRatings,
  listOutcomePackage,
  ratingQueryKeys,
  saveRatingCell,
  submitOutcomePackage,
} from "@/outcomes/databridge/ratings";
import {
  ratingForCell,
  ratingTargets,
  type RatingTarget,
} from "@/outcomes/model/outcomes";
import { enrollmentQueryKeys, listCourseEnrollments } from "@/roster/databridge/enrollments";
import { getFillCycle } from "@/grading/databridge/fillCycles";
import { submitFillPackage } from "@/grading/databridge/fillCycles";
import { fillCycleQueryKeys } from "@/grading/databridge/fillCycles";

export function useCourseRatings() {
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
    cycleQuery.data &&
    cycleQuery.data.status === "open" &&
    cycleQuery.data.requireOutcomes
      ? cycleQuery.data
      : null;
  const fillCycleId = cycle?.id ?? null;

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
  const outcomesQuery = useQuery({
    queryKey: outcomeQueryKeys.course(courseId),
    queryFn: () => listCourseOutcomes(courseId),
    enabled,
  });
  const optionsQuery = useQuery({
    queryKey: outcomeQueryKeys.ratingOptions(organization.id),
    queryFn: () => listRatingOptions(organization.id),
  });
  const enrollmentsQuery = useQuery({
    queryKey: enrollmentQueryKeys.course(courseId),
    queryFn: () => listCourseEnrollments(courseId),
    enabled,
  });
  const cycleReady = !Number.isFinite(requestedCycleId) || cycleQuery.isSuccess || cycleQuery.isError;
  const ratingsQuery = useQuery({
    queryKey: [...ratingQueryKeys.matrix(courseId), fillCycleId],
    queryFn: () => listCourseRatings(courseId, fillCycleId),
    enabled: enabled && cycleReady,
  });
  const packageQuery = useQuery({
    queryKey: [...ratingQueryKeys.package(courseId), fillCycleId],
    queryFn: () => listOutcomePackage(courseId, fillCycleId),
    enabled: enabled && cycleReady,
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
  const canEdit = Boolean(accessReady && sameOrg && staffCanManageCourse(access));
  const targets = ratingTargets(sameOrg ? (outcomesQuery.data ?? []) : []);
  const ratings = ratingsQuery.data ?? [];
  const options = (optionsQuery.data ?? []).filter((option) => option.isActive);

  function invalidate() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ratingQueryKeys.matrix(courseId) }),
      queryClient.invalidateQueries({ queryKey: ratingQueryKeys.package(courseId) }),
      queryClient.invalidateQueries({
        queryKey: fillCycleQueryKeys.workspace(organization.id),
      }),
    ]);
  }

  const save = useMutation({
    mutationFn: (input: {
      studentId: number;
      target: RatingTarget;
      ratingOptionId: number | null;
    }) => {
      if (!course) throw new Error("Course isn’t loaded.");
      const existing = ratingForCell(ratings, input.studentId, input.target);
      return saveRatingCell({
        organizationId: course.organizationId,
        courseId,
        studentId: input.studentId,
        outcomeId: input.target.outcomeId,
        criterionId: input.target.criterionId,
        ratingOptionId: input.ratingOptionId,
        existingId: existing?.id ?? null,
        fillCycleId,
      });
    },
    onSuccess: invalidate,
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!course) throw new Error("Course isn’t loaded.");
      await submitOutcomePackage({
        organizationId: course.organizationId,
        courseId,
        existingId: packageQuery.data?.id ?? null,
        fillCycleId,
      });
      if (fillCycleId != null) {
        await submitFillPackage({
          organizationId: course.organizationId,
          cycleId: fillCycleId,
          kind: "outcomes",
          courseId,
          classId: null,
        });
      }
    },
    onSuccess: invalidate,
  });

  const error =
    [
      courseQuery.error,
      instructorsQuery.error,
      outcomesQuery.error,
      optionsQuery.error,
      enrollmentsQuery.error,
      ratingsQuery.error,
      packageQuery.error,
      save.error,
      submit.error,
    ].find((item) => item instanceof Error)?.message ?? null;

  const students = (enrollmentsQuery.data ?? [])
    .map((enrollment) => ({ id: enrollment.student.id, name: enrollment.student.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    organization,
    course: sameOrg ? course : null,
    loading:
      !enabled ||
      !accessReady ||
      (canView &&
        (outcomesQuery.isLoading ||
          optionsQuery.isLoading ||
          enrollmentsQuery.isLoading ||
          ratingsQuery.isLoading ||
          packageQuery.isLoading)),
    notFound: enabled && accessReady && (!course || !sameOrg || !canView),
    canEdit,
    targets,
    students,
    options,
    ratings,
    packageSubmittedAt: packageQuery.data?.submittedAt ?? null,
    cycleLabel: cycle?.label ?? null,
    saving: save.isPending,
    submitting: submit.isPending,
    error,
    cellOptionId: (studentId: number, target: RatingTarget) =>
      ratingForCell(ratings, studentId, target)?.ratingOptionId ?? null,
    setCell: (studentId: number, target: RatingTarget, ratingOptionId: number | null) =>
      save.mutate({ studentId, target, ratingOptionId }),
    submitPackage: () => submit.mutate(),
  };
}
