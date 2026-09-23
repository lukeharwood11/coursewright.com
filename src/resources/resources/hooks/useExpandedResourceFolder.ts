import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listChildFolders,
  resourceFolderQueryKeys,
} from "@/resources/databridge/folders";
import {
  listResourceItems,
  resourceItemQueryKeys,
} from "@/resources/databridge/items";
import {
  folderCapabilities,
  itemCapabilities,
  type FolderAclSource,
  type ResourceActor,
  type ResourceGrantRecord,
} from "@/resources/model/access";
import type { ResourceTypeFilter } from "@/resources/model/paths";

export function useExpandedResourceFolder({
  organizationId,
  folder,
  enabled,
  typeFilter,
  actor,
  grants,
  knownFolders,
}: {
  organizationId: number;
  folder: FolderAclSource;
  enabled: boolean;
  typeFilter: ResourceTypeFilter;
  actor: ResourceActor;
  grants: ResourceGrantRecord[];
  knownFolders: Map<number, FolderAclSource>;
}) {
  const foldersQuery = useQuery({
    queryKey: resourceFolderQueryKeys.children(organizationId, folder.id),
    queryFn: () =>
      listChildFolders({ organizationId, parentId: folder.id }),
    enabled,
  });
  const itemsQuery = useQuery({
    queryKey: resourceItemQueryKeys.list(organizationId, folder.id),
    queryFn: () => listResourceItems({ organizationId, folderId: folder.id }),
    enabled,
  });

  const foldersById = useMemo(() => {
    const map = new Map(knownFolders);
    map.set(folder.id, folder);
    for (const child of foldersQuery.data ?? []) map.set(child.id, child);
    return map;
  }, [knownFolders, folder, foldersQuery.data]);

  const folders = (foldersQuery.data ?? []).map((child) => ({
    folder: child,
    ...folderCapabilities({
      actor,
      folder: child,
      foldersById,
      grants,
      archived: Boolean(child.archivedAt),
    }),
  }));
  const items = (itemsQuery.data ?? [])
    .filter((item) => typeFilter === "all" || item.type === typeFilter)
    .map((item) => ({
      item,
      ...itemCapabilities({
        actor,
        visibility: item.visibility,
        archived: Boolean(item.archivedAt),
        aclInherit: item.aclInherit,
        audience: {
          parentsCanView: item.parentsCanView,
          studentsCanView: item.studentsCanView,
        },
        folderId: item.folderId,
        itemId: item.id,
        foldersById,
        grants,
      }),
    }));

  return {
    folders,
    items,
    foldersById,
    loading: enabled && (foldersQuery.isLoading || itemsQuery.isLoading),
    error: foldersQuery.error?.message ?? itemsQuery.error?.message ?? null,
  };
}
