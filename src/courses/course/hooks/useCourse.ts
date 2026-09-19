import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { familyVisibleMaterials, staffCanEdit } from "@/app/layouts/model/viewMode";
import {
  courseQueryKeys,
  getCourse,
  listCourseInstructors,
  updateCourseVisibility,
} from "@/courses/databridge/courses";
import {
  listMaterialsForCourse,
  materialQueryKeys,
} from "@/materials/databridge/materials";
import {
  importantNowQueryKeys,
  listImportantNowForCourse,
} from "@/materials/databridge/importantNow";
import {
  enrollmentQueryKeys,
  listCourseEnrollments,
} from "@/roster/databridge/enrollments";
import {
  createUnit,
  listUnitsForCourse,
  unitQueryKeys,
  updateUnit,
} from "@/units/databridge/units";
import { swapPositions } from "@/units/model/order";
import type { CourseVisibility } from "@/courses/model/visibility";

export function useCourse() {
  const { courseId: courseIdParam } = useParams();
  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const queryClient = useQueryClient();
  const canEdit = staffCanEdit(role, parentPresentation);

  const courseQuery = useQuery({
    queryKey: courseQueryKeys.detail(courseId),
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const unitsQuery = useQuery({
    queryKey: unitQueryKeys.list(courseId),
    queryFn: () => listUnitsForCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const materialsQuery = useQuery({
    queryKey: materialQueryKeys.list(courseId),
    queryFn: () => listMaterialsForCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const instructorsQuery = useQuery({
    queryKey: courseQueryKeys.instructors(courseId),
    queryFn: () => listCourseInstructors(courseId),
    enabled: Number.isFinite(courseId),
  });
  const enrollmentsQuery = useQuery({
    queryKey: enrollmentQueryKeys.course(courseId),
    queryFn: () => listCourseEnrollments(courseId),
    enabled: Number.isFinite(courseId),
  });
  const importantQuery = useQuery({
    queryKey: importantNowQueryKeys.course(courseId),
    queryFn: () => listImportantNowForCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const originQuery = useQuery({
    queryKey: ["courses", "detail", courseQuery.data?.copiedFromCourseId ?? 0],
    queryFn: () => getCourse(courseQuery.data!.copiedFromCourseId!),
    enabled: Boolean(courseQuery.data?.copiedFromCourseId),
  });

  const course = courseQuery.data ?? null;
  const belongsHere = course?.organizationId === organization.id;
  const familyCourseHidden =
    parentPresentation &&
    course != null &&
    (course.visibility !== "published" || course.status !== "active");
  const materials = parentPresentation
    ? familyVisibleMaterials(materialsQuery.data ?? [])
    : (materialsQuery.data ?? []);
  const units = unitsQuery.data ?? [];
  const importantIds = new Set(
    (importantQuery.data ?? []).map((row) => row.materialId),
  );

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: courseQueryKeys.detail(courseId) });
    void queryClient.invalidateQueries({ queryKey: unitQueryKeys.list(courseId) });
    void queryClient.invalidateQueries({
      queryKey: materialQueryKeys.list(courseId),
    });
    void queryClient.invalidateQueries({
      queryKey: courseQueryKeys.instructors(courseId),
    });
    void queryClient.invalidateQueries({
      queryKey: enrollmentQueryKeys.course(courseId),
    });
  }

  const addUnit = useMutation({
    mutationFn: (title: string) =>
      createUnit({
        organizationId: organization.id,
        courseId,
        title: title.trim() || "New unit",
        startDate: null,
        endDate: null,
      }),
    onSuccess: invalidate,
  });

  const reorderUnit = useMutation({
    mutationFn: async (args: { id: number; direction: "up" | "down" }) => {
      const swaps = swapPositions(units, args.id, args.direction);
      if (!swaps) return;
      await Promise.all(
        swaps.map((item) => updateUnit(item.id, { position: item.position })),
      );
    },
    onSuccess: invalidate,
  });

  const setVisibility = useMutation({
    mutationFn: (visibility: CourseVisibility) =>
      updateCourseVisibility(courseId, visibility),
    onSuccess: invalidate,
  });

  return {
    organization,
    canEdit,
    isParent: parentPresentation,
    course: belongsHere ? course : null,
    copiedFromTitle: originQuery.data?.title ?? null,
    units,
    topLevelMaterials: materials.filter((row) => row.unitId == null),
    materialsByUnitId: materials.reduce<Record<number, typeof materials>>((acc, row) => {
      if (row.unitId == null) return acc;
      const list = acc[row.unitId] ?? [];
      list.push(row);
      acc[row.unitId] = list;
      return acc;
    }, {}),
    instructors: instructorsQuery.data ?? [],
    students: (enrollmentsQuery.data ?? []).filter(
      (row) => row.status === "active",
    ),
    importantIds,
    loading:
      courseQuery.isLoading ||
      unitsQuery.isLoading ||
      materialsQuery.isLoading,
    error: courseQuery.error
      ? courseQuery.error.message
      : unitsQuery.error
        ? unitsQuery.error.message
        : materialsQuery.error
          ? materialsQuery.error.message
          : addUnit.error?.message ??
            reorderUnit.error?.message ??
            setVisibility.error?.message ??
            null,
    notFound:
      !courseQuery.isLoading &&
      (!course || !belongsHere || familyCourseHidden),
    addUnit,
    reorderUnit,
    setVisibility,
    invalidate,
  };
}
