import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  courseResourceLinkFamilyAccessWarning,
  effectiveAudienceForCourseLink,
} from "@/courses/model/courseResourceLinkAccess";
import type { MaterialKind } from "@/materials/model/kind";
import {
  listOrgResourceFolders,
  resourceFolderQueryKeys,
} from "@/resources/databridge/folders";
import { listOrgResourceItemsByIds } from "@/resources/databridge/items";
import type { FolderAclSource } from "@/resources/model/access";

export function useResourceMaterialAccessWarnings(args: {
  organizationId: number;
  materials: ReadonlyArray<{
    id: number;
    kind: MaterialKind;
    resourceFolderId: number | null;
    resourceItemId: number | null;
  }>;
  enabled: boolean;
}): Map<number, string> {
  const resourceMaterials = args.materials.filter((material) => material.kind === "resource");
  const itemIds = [
    ...new Set(
      resourceMaterials.flatMap((material) =>
        material.resourceItemId != null ? [material.resourceItemId] : [],
      ),
    ),
  ].sort((a, b) => a - b);
  const active = args.enabled && resourceMaterials.length > 0;

  const foldersQuery = useQuery({
    queryKey: resourceFolderQueryKeys.all(args.organizationId),
    queryFn: () => listOrgResourceFolders(args.organizationId),
    enabled: active && Number.isFinite(args.organizationId),
  });

  const itemsQuery = useQuery({
    queryKey: ["org-resources", "items-by-id", args.organizationId, itemIds.join(",")] as const,
    queryFn: () => listOrgResourceItemsByIds(itemIds),
    enabled: active && itemIds.length > 0,
  });

  return useMemo(() => {
    const warnings = new Map<number, string>();
    if (!active) return warnings;

    const foldersById = new Map<number, FolderAclSource>();
    for (const folder of foldersQuery.data ?? []) {
      foldersById.set(folder.id, {
        id: folder.id,
        parentId: folder.parentId,
        parentsCanView: folder.parentsCanView,
        studentsCanView: folder.studentsCanView,
        aclInherit: folder.aclInherit,
      });
    }
    const itemsById = new Map((itemsQuery.data ?? []).map((item) => [item.id, item]));
    const foldersReady = foldersQuery.isSuccess || foldersQuery.isError;
    const itemsReady = itemIds.length === 0 || itemsQuery.isSuccess || itemsQuery.isError;
    if (!foldersReady) return warnings;

    for (const material of resourceMaterials) {
      if (material.resourceFolderId != null) {
        const folder = foldersById.get(material.resourceFolderId);
        const unresolved = foldersQuery.isError || !folder;
        const { audience, unresolved: audienceUnresolved } = folder
          ? effectiveAudienceForCourseLink({
              kind: "folder",
              folderId: folder.id,
              parentId: folder.parentId,
              aclInherit: folder.aclInherit,
              draft: {
                parentsCanView: folder.parentsCanView,
                studentsCanView: folder.studentsCanView,
              },
              foldersById,
            })
          : {
              audience: { parentsCanView: false, studentsCanView: false },
              unresolved: true,
            };
        const warning = courseResourceLinkFamilyAccessWarning({
          kind: "folder",
          visibility: null,
          audience,
          unresolved: unresolved || audienceUnresolved,
        });
        if (warning) warnings.set(material.id, warning);
        continue;
      }
      if (material.resourceItemId == null || !itemsReady) continue;
      const item = itemsById.get(material.resourceItemId);
      const unresolved = itemsQuery.isError || !item || item.archivedAt != null;
      const { audience, unresolved: audienceUnresolved } = item
        ? effectiveAudienceForCourseLink({
            kind: "item",
            folderId: item.folderId,
            parentId: null,
            aclInherit: item.aclInherit,
            draft: {
              parentsCanView: item.parentsCanView,
              studentsCanView: item.studentsCanView,
            },
            foldersById,
          })
        : {
            audience: { parentsCanView: false, studentsCanView: false },
            unresolved: true,
          };
      const warning = courseResourceLinkFamilyAccessWarning({
        kind: "item",
        visibility: item && item.archivedAt == null ? item.visibility : null,
        audience,
        unresolved: unresolved || audienceUnresolved,
      });
      if (warning) warnings.set(material.id, warning);
    }
    return warnings;
  }, [
    active,
    foldersQuery.data,
    foldersQuery.isError,
    foldersQuery.isSuccess,
    itemIds,
    itemsQuery.data,
    itemsQuery.isError,
    itemsQuery.isSuccess,
    resourceMaterials,
  ]);
}
