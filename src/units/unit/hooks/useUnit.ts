import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { getCourse } from "@/courses/databridge/courses";
import { familyVisibleMaterials, staffCanEdit } from "@/app/layouts/model/viewMode";
import {
  importantNowQueryKeys,
  listImportantNowForCourse,
} from "@/materials/databridge/importantNow";
import {
  listMaterialsForUnit,
  materialQueryKeys,
  updateMaterial,
} from "@/materials/databridge/materials";
import {
  getUnit,
  restoreUnit,
  softDeleteUnit,
  unitQueryKeys,
  updateUnit,
} from "@/units/databridge/units";
import { swapPositions } from "@/units/model/order";

export function useUnit() {
  const { courseId: courseIdParam, unitId: unitIdParam } = useParams();
  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const unitId = unitIdParam ? Number(unitIdParam) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const queryClient = useQueryClient();
  const canEdit = staffCanEdit(role, parentPresentation);

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

  const unit = unitQuery.data ?? null;
  const course = courseQuery.data ?? null;
  const belongsHere =
    unit?.courseId === courseId && course?.organizationId === organization.id;
  const familyCourseHidden =
    parentPresentation &&
    course != null &&
    (course.visibility !== "published" || course.status !== "active");
  const materials = parentPresentation
    ? familyVisibleMaterials(materialsQuery.data ?? [])
    : (materialsQuery.data ?? []);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: unitQueryKeys.detail(unitId) });
    void queryClient.invalidateQueries({ queryKey: materialQueryKeys.unit(unitId) });
    void queryClient.invalidateQueries({ queryKey: materialQueryKeys.list(courseId) });
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

  const reorderMaterial = useMutation({
    mutationFn: async (args: { id: number; direction: "up" | "down" }) => {
      const items = materialsQuery.data ?? [];
      const swaps = swapPositions(items, args.id, args.direction);
      if (!swaps) return;
      await Promise.all(
        swaps.map((item) => updateMaterial(item.id, { position: item.position })),
      );
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
    importantIds: new Set((importantQuery.data ?? []).map((row) => row.materialId)),
    loading: unitQuery.isLoading || courseQuery.isLoading,
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
    reorderMaterial,
  };
}
