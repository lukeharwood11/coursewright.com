import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { isStaffRole } from "@/organizations/model/role";
import { fileSignedUrl, getFile } from "@/materials/databridge/files";
import { listResourceBlocks, resourceBlockQueryKeys } from "@/resources/databridge/blocks";
import {
  getResourceFolder,
  loadFolderAncestors,
  resourceFolderQueryKeys,
} from "@/resources/databridge/folders";
import {
  listMyResourceGrants,
  resourceGrantQueryKeys,
} from "@/resources/databridge/grants";
import {
  archiveResourceItem,
  getResourceItem,
  resourceItemQueryKeys,
  updateResourceItem,
} from "@/resources/databridge/items";
import { itemCapabilities, type FolderAclSource } from "@/resources/model/access";
import type { ResourceVisibility } from "@/resources/model/kinds";

export function useResource() {
  const params = useParams();
  const itemId = params.itemId ? Number(params.itemId) : NaN;
  const { organization, role, isParent, isStudent } = useOrgShell();
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const isStaff = role ? isStaffRole(role) : false;

  const itemQuery = useQuery({
    queryKey: resourceItemQueryKeys.detail(itemId),
    queryFn: () => getResourceItem(itemId),
    enabled: Number.isFinite(itemId),
  });
  const item = itemQuery.data ?? null;

  const blocksQuery = useQuery({
    queryKey: resourceBlockQueryKeys.list(itemId),
    queryFn: () => listResourceBlocks(itemId),
    enabled: item?.type === "document",
  });
  const fileQuery = useQuery({
    queryKey: ["files", "detail", item?.fileId ?? 0],
    queryFn: () => getFile(item!.fileId!),
    enabled: item?.type === "file" && item.fileId != null,
  });
  const fileUrlQuery = useQuery({
    queryKey: ["files", "url", fileQuery.data?.storageRef ?? ""],
    queryFn: () => fileSignedUrl(fileQuery.data!.storageRef),
    enabled: Boolean(fileQuery.data?.storageRef),
  });
  const fileDownloadQuery = useQuery({
    queryKey: ["files", "download", fileQuery.data?.storageRef ?? ""],
    queryFn: () =>
      fileSignedUrl(fileQuery.data!.storageRef, {
        download: fileQuery.data!.filename,
      }),
    enabled: Boolean(fileQuery.data?.storageRef),
  });
  const folderQuery = useQuery({
    queryKey: resourceFolderQueryKeys.detail(item?.folderId ?? 0),
    queryFn: () => getResourceFolder(item!.folderId!),
    enabled: item?.folderId != null,
  });
  const ancestorsQuery = useQuery({
    queryKey: resourceFolderQueryKeys.ancestors(item?.folderId ?? 0),
    queryFn: () => loadFolderAncestors(item!.folderId!),
    enabled: item?.folderId != null,
  });
  const grantsQuery = useQuery({
    queryKey: resourceGrantQueryKeys.mine(organization.id, user.id),
    queryFn: () => listMyResourceGrants(organization.id, user.id),
  });

  const folderPending =
    item?.folderId != null && folderQuery.data === undefined && !folderQuery.isError;

  const foldersById = new Map<number, FolderAclSource>();
  for (const folder of ancestorsQuery.data ?? []) foldersById.set(folder.id, folder);
  if (folderQuery.data) foldersById.set(folderQuery.data.id, folderQuery.data);

  const caps = item
    ? itemCapabilities({
        actor: {
          userId: user.id,
          isStaff,
          isParent: role === "parent" || isParent,
          isStudent: role === "student" || isStudent,
        },
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
        grants: grantsQuery.data ?? [],
      })
    : { canView: false, canEdit: false };

  const visibility = useMutation({
    mutationFn: (next: ResourceVisibility) =>
      updateResourceItem(itemId, { visibility: next }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: resourceItemQueryKeys.detail(itemId),
      });
    },
  });

  const archive = useMutation({
    mutationFn: () => archiveResourceItem(itemId),
  });

  const move = useMutation({
    mutationFn: (folderId: number | null) =>
      updateResourceItem(itemId, { folderId }),
    onSuccess: (_updated, folderId) => {
      void queryClient.invalidateQueries({
        queryKey: resourceItemQueryKeys.detail(itemId),
      });
      void queryClient.invalidateQueries({
        queryKey: resourceItemQueryKeys.list(organization.id, folderId),
      });
      void queryClient.invalidateQueries({
        queryKey: resourceItemQueryKeys.list(organization.id, item?.folderId ?? null),
      });
      void queryClient.invalidateQueries({
        queryKey: resourceFolderQueryKeys.all(organization.id),
      });
    },
  });

  return {
    organization,
    item,
    blocks: blocksQuery.data ?? [],
    blocksLoading: blocksQuery.isLoading,
    file: fileQuery.data ?? null,
    fileUrl: fileUrlQuery.data ?? null,
    fileDownloadUrl: fileDownloadQuery.data ?? null,
    folder: folderQuery.data ?? null,
    ancestors: ancestorsQuery.data ?? [],
    canEdit: caps.canEdit,
    isStaff,
    loading: itemQuery.isLoading || folderPending,
    notFound: !itemQuery.isLoading && !item,
    error:
      itemQuery.error?.message ??
      folderQuery.error?.message ??
      visibility.error?.message ??
      archive.error?.message ??
      move.error?.message ??
      null,
    publish: () => visibility.mutate("published"),
    unpublish: () => visibility.mutate("unpublished"),
    visibilityPending: visibility.isPending,
    archive,
    move,
    invalidate: () => {
      void queryClient.invalidateQueries({
        queryKey: resourceItemQueryKeys.detail(itemId),
      });
    },
  };
}
