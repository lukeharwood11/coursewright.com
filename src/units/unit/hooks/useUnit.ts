import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  courseQueryKeys,
  getCourse,
  listCourseInstructors,
} from "@/courses/databridge/courses";
import { familyVisibleMaterials, staffCanEdit } from "@/app/layouts/model/viewMode";
import { staffCanManageCourse } from "@/courses/model/access";
import {
  importantNowQueryKeys,
  listImportantNowForCourse,
} from "@/materials/databridge/importantNow";
import {
  listMaterialsForUnit,
  materialQueryKeys,
} from "@/materials/databridge/materials";
import {
  getUnit,
  restoreUnit,
  softDeleteUnit,
  unitQueryKeys,
  updateUnit,
} from "@/units/databridge/units";
import { persistOutlinePositionPatches } from "@/units/databridge/persistOutlineOrder";
import { outlinePositionPatches, type OutlineItem } from "@/quizzes/model/outline";
import {
  listLinkedStudents,
  listQuizAttemptSummariesForQuizzes,
  listQuizzesForUnit,
  quizQueryKeys,
} from "@/quizzes/databridge/quizzes";
import { latestAttemptByQuizId } from "@/quizzes/model/quiz";

export function useUnit() {
  const { courseId: courseIdParam, unitId: unitIdParam } = useParams();
  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const unitId = unitIdParam ? Number(unitIdParam) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const staffEdit = staffCanEdit(role, parentPresentation);

  const unitQuery = useQuery({
    queryKey: unitQueryKeys.detail(unitId),
    queryFn: () => getUnit(unitId),
    enabled: Number.isFinite(unitId),
  });
  const courseQuery = useQuery({
    queryKey: ["courses", "detail", courseId],
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const quizzesQuery = useQuery({
    queryKey: quizQueryKeys.unit(unitId),
    queryFn: () => listQuizzesForUnit(unitId),
    enabled: Number.isFinite(unitId),
  });
  const materialsQuery = useQuery({
    queryKey: materialQueryKeys.unit(unitId),
    queryFn: () => listMaterialsForUnit(unitId),
    enabled: Number.isFinite(unitId),
  });
  const importantQuery = useQuery({
    queryKey: importantNowQueryKeys.course(courseId),
    queryFn: () => listImportantNowForCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const instructorsQuery = useQuery({
    queryKey: courseQueryKeys.instructors(courseId),
    queryFn: () => listCourseInstructors(courseId),
    enabled: Number.isFinite(courseId) && staffEdit,
  });
  const linkedStudentsQuery = useQuery({
    queryKey: ["quizzes", "linked-students", courseId, user.id],
    queryFn: () => listLinkedStudents(courseId, user.id),
    enabled: Number.isFinite(courseId) && parentPresentation,
  });

  const unit = unitQuery.data ?? null;
  const course = courseQuery.data ?? null;
  const belongsHere =
    unit?.courseId === courseId && course?.organizationId === organization.id;
  const canEdit = staffCanManageCourse({
    role,
    parentPresentation,
    userId: user.id,
    instructorUserIds: (instructorsQuery.data ?? []).map((row) => row.userId),
  });
  const familyCourseHidden =
    parentPresentation &&
    course != null &&
    (course.visibility !== "published" || course.status !== "active");
  const materials = parentPresentation
    ? familyVisibleMaterials(materialsQuery.data ?? [])
    : (materialsQuery.data ?? []);
  const quizzes = parentPresentation
    ? familyVisibleMaterials(quizzesQuery.data ?? [])
    : (quizzesQuery.data ?? []);
  const linkedStudentIds = (linkedStudentsQuery.data ?? []).map((row) => row.id);
  const studentKey =
    linkedStudentIds.slice().sort((a, b) => a - b).join(",") || "none";
  const attemptsQuery = useQuery({
    queryKey: quizQueryKeys.attemptSummaries(courseId, studentKey),
    queryFn: () =>
      listQuizAttemptSummariesForQuizzes(
        quizzes.map((quiz) => quiz.id),
        linkedStudentIds,
      ),
    enabled:
      parentPresentation &&
      Number.isFinite(courseId) &&
      quizzes.length > 0 &&
      linkedStudentIds.length > 0,
  });
  const attemptByQuizId = latestAttemptByQuizId(attemptsQuery.data ?? []);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: unitQueryKeys.detail(unitId) });
    void queryClient.invalidateQueries({ queryKey: materialQueryKeys.unit(unitId) });
    void queryClient.invalidateQueries({ queryKey: quizQueryKeys.unit(unitId) });
    void queryClient.invalidateQueries({ queryKey: materialQueryKeys.list(courseId) });
    void queryClient.invalidateQueries({ queryKey: quizQueryKeys.list(courseId) });
    void queryClient.invalidateQueries({ queryKey: unitQueryKeys.list(courseId) });
  };

  const saveUnit = useMutation({
    mutationFn: (patch: {
      title: string;
      startDate: string | null;
      endDate: string | null;
    }) => updateUnit(unitId, patch),
    onSuccess: invalidate,
  });

  const removeUnit = useMutation({
    mutationFn: () => softDeleteUnit(unitId),
    onSuccess: invalidate,
  });

  const restore = useMutation({
    mutationFn: () => restoreUnit(unitId),
    onSuccess: invalidate,
  });

  const reorderOutline = useMutation({
    mutationFn: async (args: { ordered: OutlineItem[] }) => {
      await persistOutlinePositionPatches(outlinePositionPatches(args.ordered));
    },
    onSuccess: invalidate,
  });

  return {
    organization,
    canEdit,
    isParent: parentPresentation,
    courseId,
    unitId,
    unit: belongsHere ? unit : null,
    course: belongsHere ? course : null,
    materials,
    quizzes,
    attemptByQuizId,
    importantIds: new Set((importantQuery.data ?? []).map((row) => row.materialId)),
    loading:
      unitQuery.isLoading ||
      courseQuery.isLoading ||
      instructorsQuery.isLoading ||
      quizzesQuery.isLoading,
    error: unitQuery.error
      ? unitQuery.error.message
      : courseQuery.error
        ? courseQuery.error.message
        : materialsQuery.error
          ? materialsQuery.error.message
          : saveUnit.error?.message ??
            removeUnit.error?.message ??
            restore.error?.message ??
            null,
    notFound:
      !unitQuery.isLoading && (!unit || !belongsHere || familyCourseHidden),
    saveUnit,
    removeUnit,
    restore,
    reorderOutline,
  };
}
