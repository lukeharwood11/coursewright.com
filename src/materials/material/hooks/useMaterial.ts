import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { getCourse } from "@/courses/databridge/courses";
import { isStaffRole } from "@/organizations/model/role";
import { listBlocks } from "@/materials/databridge/blocks";
import { fileSignedUrl, getFile } from "@/materials/databridge/files";
import {
  importantNowQueryKeys,
  listImportantNowForCourse,
  setImportantNow,
} from "@/materials/databridge/importantNow";
import {
  getMaterial,
  listMaterialVersions,
  materialQueryKeys,
  restoreMaterial,
  revertMaterialToVersion,
  softDeleteMaterial,
  updateMaterial,
} from "@/materials/databridge/materials";
import { getUnit } from "@/units/databridge/units";
import type { MaterialVisibility } from "@/materials/model/visibility";

export function useMaterial() {
  const params = useParams();
  const courseId = params.courseId ? Number(params.courseId) : NaN;
  const unitId = params.unitId ? Number(params.unitId) : null;
  const materialId = params.materialId ? Number(params.materialId) : NaN;
  const { organization, role } = useOrgShell();
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const canEdit = isStaffRole(role);

  const materialQuery = useQuery({
    queryKey: materialQueryKeys.detail(materialId),
    queryFn: () => getMaterial(materialId),
    enabled: Number.isFinite(materialId),
  });
  const courseQuery = useQuery({
    queryKey: ["courses", "detail", courseId],
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const unitQuery = useQuery({
    queryKey: ["units", "detail", unitId ?? 0],
    queryFn: () => getUnit(unitId!),
    enabled: unitId != null && Number.isFinite(unitId),
  });
  const blocksQuery = useQuery({
    queryKey: materialQueryKeys.blocks(materialId),
    queryFn: () => listBlocks(materialId),
    enabled: Number.isFinite(materialId),
  });
  const fileQuery = useQuery({
    queryKey: ["files", "detail", materialQuery.data?.fileId ?? 0],
    queryFn: () => getFile(materialQuery.data!.fileId!),
    enabled: Boolean(materialQuery.data?.fileId),
  });
  const signedQuery = useQuery({
    queryKey: ["files", "signed", fileQuery.data?.storageRef ?? ""],
    queryFn: () => fileSignedUrl(fileQuery.data!.storageRef),
    enabled: Boolean(fileQuery.data?.storageRef),
  });
  const downloadQuery = useQuery({
    queryKey: [
      "files",
      "download",
      fileQuery.data?.storageRef ?? "",
      fileQuery.data?.filename ?? "",
    ],
    queryFn: () =>
      fileSignedUrl(fileQuery.data!.storageRef, {
        download: fileQuery.data!.filename,
      }),
    enabled: Boolean(fileQuery.data?.storageRef),
  });
  const importantQuery = useQuery({
    queryKey: importantNowQueryKeys.course(courseId),
    queryFn: () => listImportantNowForCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const versionsQuery = useQuery({
    queryKey: materialQueryKeys.versions(materialId),
    queryFn: () => listMaterialVersions(materialId),
    enabled: canEdit && Number.isFinite(materialId),
  });

  const material = materialQuery.data ?? null;
  const course = courseQuery.data ?? null;
  const belongsHere =
    material?.courseId === courseId &&
    course?.organizationId === organization.id &&
    (unitId == null || material.unitId === unitId);

  function invalidate() {
    void queryClient.invalidateQueries({
      queryKey: materialQueryKeys.detail(materialId),
    });
    void queryClient.invalidateQueries({
      queryKey: materialQueryKeys.list(courseId),
    });
    void queryClient.invalidateQueries({
      queryKey: materialQueryKeys.blocks(materialId),
    });
    void queryClient.invalidateQueries({
      queryKey: materialQueryKeys.versions(materialId),
    });
    void queryClient.invalidateQueries({
      queryKey: importantNowQueryKeys.course(courseId),
    });
  }

  const importantNow = (importantQuery.data ?? []).some(
    (row) => row.materialId === materialId,
  );

  const toggleImportant = useMutation({
    mutationFn: (flagged: boolean) =>
      setImportantNow({
        organizationId: organization.id,
        courseId,
        materialId,
        createdBy: user.id,
        flagged,
      }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: () => softDeleteMaterial(materialId, user.id),
    onSuccess: invalidate,
  });

  const restore = useMutation({
    mutationFn: () => restoreMaterial(materialId),
    onSuccess: invalidate,
  });

  const setVisibility = useMutation({
    mutationFn: (visibility: MaterialVisibility) =>
      updateMaterial(materialId, { visibility }),
    onSuccess: invalidate,
  });

  const revert = useMutation({
    mutationFn: (snapshot: unknown) => revertMaterialToVersion(materialId, snapshot),
    onSuccess: invalidate,
  });

  return {
    organization,
    canEdit,
    isParent: role === "parent",
    courseId,
    unitId: unitId && Number.isFinite(unitId) ? unitId : material?.unitId ?? null,
    materialId,
    material: belongsHere ? material : null,
    course: belongsHere ? course : null,
    unit: unitQuery.data ?? null,
    blocks: blocksQuery.data ?? [],
    file: fileQuery.data ?? null,
    fileUrl: signedQuery.data ?? null,
    fileDownloadUrl: downloadQuery.data ?? null,
    importantNow,
    versions: versionsQuery.data ?? [],
    loading: materialQuery.isLoading || courseQuery.isLoading,
    error: materialQuery.error?.message ?? courseQuery.error?.message ?? null,
    notFound: !materialQuery.isLoading && (!material || !belongsHere),
    toggleImportant,
    remove,
    restore,
    setVisibility,
    revert,
    invalidate,
    userId: user.id,
  };
}
