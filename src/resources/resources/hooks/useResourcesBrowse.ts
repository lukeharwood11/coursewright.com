import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import { isStaffRole } from "@/organizations/model/role";
import {
  archiveResourceFolder,
  createResourceFolder,
  getResourceFolder,
  listChildFolders,
  listOrgResourceFolders,
  loadFolderAncestors,
  resourceFolderQueryKeys,
  updateResourceFolder,
} from "@/resources/databridge/folders";
import {
  archiveResourceItem,
  createResourceItem,
  listOrgResourceItems,
  listResourceItems,
  resourceItemQueryKeys,
  updateResourceItem,
} from "@/resources/databridge/items";
import {
  listMyResourceGrants,
  resourceGrantQueryKeys,
} from "@/resources/databridge/grants";
import {
  folderCapabilities,
  itemCapabilities,
  type FolderAclSource,
} from "@/resources/model/access";
import {
  parseResourceTypeFilter,
  type ResourceTypeFilter,
} from "@/resources/model/paths";
import { resourceBrowseChildren } from "@/resources/model/tree";
import type { ResourceVisibility } from "@/resources/model/kinds";
import {
  validateFolderName,
  validateNewResource,
  validateResourceTitle,
} from "@/resources/model/validate";
import {
  buildResourceFilesZip,
  resourceFileDownloadUrl,
} from "@/resources/databridge/download";
import type {
  SelectedResourceFolder,
  SelectedResourceItem,
} from "@/resources/model/selection";
import { useResourceUploadStore } from "@/resources/stores/uploadQueue";
import { caughtErrorMessage } from "@/ui/toast";

export function useResourcesBrowse() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = params.folderId ? Number(params.folderId) : null;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const isStaff = role ? isStaffRole(role) : false;
  const canCreateStaff = staffCanEdit(role, parentPresentation);
  const typeFilter = parseResourceTypeFilter(searchParams.get("type"));
  // Parents and students cannot select staff-only ancestors. At the library
  // root, load every row RLS already allows and surface ones whose folder
  // is missing. Staff keep the real folder tree.
  const listSharedAtRoot = !isStaff && folderId == null;

  const foldersQuery = useQuery({
    queryKey: listSharedAtRoot
      ? resourceFolderQueryKeys.all(organization.id)
      : resourceFolderQueryKeys.children(organization.id, folderId),
    queryFn: () =>
      listSharedAtRoot
        ? listOrgResourceFolders(organization.id)
        : listChildFolders({ organizationId: organization.id, parentId: folderId }),
  });
  const itemsQuery = useQuery({
    queryKey: listSharedAtRoot
      ? resourceItemQueryKeys.visible(organization.id)
      : resourceItemQueryKeys.list(organization.id, folderId),
    queryFn: () =>
      listSharedAtRoot
        ? listOrgResourceItems(organization.id)
        : listResourceItems({ organizationId: organization.id, folderId }),
  });
  const folderQuery = useQuery({
    queryKey: resourceFolderQueryKeys.detail(folderId ?? 0),
    queryFn: () => getResourceFolder(folderId!),
    enabled: folderId != null,
  });
  const ancestorsQuery = useQuery({
    queryKey: resourceFolderQueryKeys.ancestors(folderId ?? 0),
    queryFn: () => loadFolderAncestors(folderId!),
    enabled: folderId != null,
  });
  const grantsQuery = useQuery({
    queryKey: resourceGrantQueryKeys.mine(organization.id, user.id),
    queryFn: () => listMyResourceGrants(organization.id, user.id),
  });

  const foldersById = useMemo(() => {
    const map = new Map<number, FolderAclSource>();
    for (const folder of ancestorsQuery.data ?? []) {
      map.set(folder.id, folder);
    }
    for (const folder of foldersQuery.data ?? []) {
      map.set(folder.id, folder);
    }
    if (folderQuery.data) map.set(folderQuery.data.id, folderQuery.data);
    return map;
  }, [ancestorsQuery.data, foldersQuery.data, folderQuery.data]);

  const actor = {
    userId: user.id,
    isStaff,
    isParent: role === "parent",
    isStudent: role === "student",
  };
  const grants = grantsQuery.data ?? [];
  const currentFolder = folderQuery.data ?? null;
  const folderCaps =
    currentFolder == null
      ? { canView: true, canEdit: canCreateStaff || isStaff }
      : folderCapabilities({
          actor,
          folder: currentFolder,
          foldersById,
          grants,
          archived: Boolean(currentFolder.archivedAt),
        });
  const canEditHere = folderId == null ? canCreateStaff : folderCaps.canEdit;

  const listed = useMemo(() => {
    const folders = foldersQuery.data ?? [];
    const items = itemsQuery.data ?? [];
    if (!listSharedAtRoot) return { folders, items };
    const placed = resourceBrowseChildren({
      folders,
      items,
      parentId: null,
    });
    return {
      folders: [...placed.folders].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      ),
      items: placed.items,
    };
  }, [listSharedAtRoot, foldersQuery.data, itemsQuery.data]);

  const folders = listed.folders.map((folder) => ({
    folder,
    ...folderCapabilities({
      actor,
      folder,
      foldersById,
      grants,
      archived: Boolean(folder.archivedAt),
    }),
  }));
  const items = listed.items
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

  const [error, setError] = useState<string | null>(null);

  function invalidateBrowse() {
    void queryClient.invalidateQueries({ queryKey: ["org-resources"] });
  }

  const createFolder = useMutation({
    mutationFn: async (name: string) => {
      const message = validateFolderName(name);
      if (message) throw new Error(message);
      return createResourceFolder({
        organizationId: organization.id,
        parentId: folderId,
        name,
        createdBy: user.id,
      });
    },
    onSuccess: invalidateBrowse,
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const moveFolder = useMutation({
    mutationFn: async (input: {
      id: number;
      parentId: number | null;
      aclInherit: boolean;
    }) => {
      return updateResourceFolder(input.id, {
        parentId: input.parentId,
        aclInherit: input.parentId == null ? false : input.aclInherit,
      });
    },
    onSuccess: invalidateBrowse,
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const moveItem = useMutation({
    mutationFn: async (input: { id: number; folderId: number | null }) => {
      return updateResourceItem(input.id, { folderId: input.folderId });
    },
    onSuccess: invalidateBrowse,
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const renameFolder = useMutation({
    mutationFn: async (input: { id: number; name: string }) => {
      const message = validateFolderName(input.name);
      if (message) throw new Error(message);
      return updateResourceFolder(input.id, { name: input.name });
    },
    onSuccess: invalidateBrowse,
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const renameItem = useMutation({
    mutationFn: async (input: { id: number; title: string }) => {
      const message = validateResourceTitle(input.title);
      if (message) throw new Error(message);
      return updateResourceItem(input.id, { title: input.title });
    },
    onSuccess: invalidateBrowse,
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const archiveFolder = useMutation({
    mutationFn: (id: number) => archiveResourceFolder(id),
    onSuccess: invalidateBrowse,
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const archiveItem = useMutation({
    mutationFn: (id: number) => archiveResourceItem(id),
    onSuccess: invalidateBrowse,
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const setItemVisibility = useMutation({
    mutationFn: (input: { id: number; visibility: ResourceVisibility }) =>
      updateResourceItem(input.id, { visibility: input.visibility }),
    onSuccess: invalidateBrowse,
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const batchMove = useMutation({
    mutationFn: async (input: {
      folders: SelectedResourceFolder[];
      items: SelectedResourceItem[];
      parentId: number | null;
    }) => {
      for (const folder of input.folders) {
        if (folder.id === input.parentId) continue;
        await updateResourceFolder(folder.id, {
          parentId: input.parentId,
          aclInherit: input.parentId == null ? false : folder.aclInherit,
        });
      }
      for (const item of input.items) {
        await updateResourceItem(item.id, { folderId: input.parentId });
      }
    },
    onSuccess: invalidateBrowse,
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const batchArchive = useMutation({
    mutationFn: async (input: { folderIds: number[]; itemIds: number[] }) => {
      for (const id of input.folderIds) await archiveResourceFolder(id);
      for (const id of input.itemIds) await archiveResourceItem(id);
    },
    onSuccess: invalidateBrowse,
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const batchVisibility = useMutation({
    mutationFn: async (input: { ids: number[]; visibility: ResourceVisibility }) => {
      for (const id of input.ids) {
        await updateResourceItem(id, { visibility: input.visibility });
      }
    },
    onSuccess: invalidateBrowse,
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const downloadFiles = useMutation({
    mutationFn: async (files: { title: string; fileId: number }[]) => {
      if (files.length === 0) throw new Error("Nothing to download.");
      if (files.length === 1) {
        const only = files[0];
        if (!only) throw new Error("Nothing to download.");
        const url = await resourceFileDownloadUrl(only.fileId);
        triggerDownload(url);
        return;
      }
      const zip = await buildResourceFilesZip(files);
      triggerDownloadBytes(zip.filename, zip.bytes);
    },
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const createDocument = useMutation({
    mutationFn: async (title: string) => {
      const message = validateNewResource({ type: "document", title });
      if (message) throw new Error(message);
      return createResourceItem({
        organizationId: organization.id,
        folderId,
        type: "document",
        title,
        createdBy: user.id,
      });
    },
    onSuccess: invalidateBrowse,
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  const createLink = useMutation({
    mutationFn: async (input: { title: string; url: string }) => {
      const message = validateNewResource({
        type: "link",
        title: input.title,
        url: input.url,
      });
      if (message) throw new Error(message);
      return createResourceItem({
        organizationId: organization.id,
        folderId,
        type: "link",
        title: input.title,
        url: input.url.trim(),
        createdBy: user.id,
      });
    },
    onSuccess: invalidateBrowse,
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  function setTypeFilter(next: ResourceTypeFilter) {
    const nextParams = new URLSearchParams(searchParams);
    if (next === "all") nextParams.delete("type");
    else nextParams.set("type", next);
    setSearchParams(nextParams, { replace: true });
  }

  function enqueueFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    useResourceUploadStore.getState().enqueue(
      files.map((file) => ({
        organizationId: organization.id,
        folderId,
        createdBy: user.id,
        file,
      })),
    );
  }

  const loading =
    foldersQuery.isLoading ||
    itemsQuery.isLoading ||
    (folderId != null && folderQuery.isLoading);
  const notFound = folderId != null && !folderQuery.isLoading && !folderQuery.data;

  return {
    organization,
    folderId,
    currentFolder,
    ancestors: ancestorsQuery.data ?? [],
    folders,
    items,
    actor,
    grants,
    foldersById,
    typeFilter,
    setTypeFilter,
    canEditHere,
    isStaff,
    loading,
    notFound,
    error:
      error ??
      foldersQuery.error?.message ??
      itemsQuery.error?.message ??
      folderQuery.error?.message ??
      null,
    createFolder,
    createDocument,
    createLink,
    moveFolder,
    moveItem,
    renameFolder,
    renameItem,
    archiveFolder,
    archiveItem,
    setItemVisibility,
    batchMove,
    batchArchive,
    batchVisibility,
    downloadFiles,
    enqueueFiles,
    invalidateBrowse,
  };
}

function triggerDownload(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function triggerDownloadBytes(filename: string, bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
