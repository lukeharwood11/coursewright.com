import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCourseResourceLinks } from "@/courses/course/hooks/useCourseResourceLinks";
import type { CourseResourceLinkRecord } from "@/courses/databridge/courseResourceLinks";
import {
  buildLessonPlanResourcePicker,
  catalogFromPicker,
  type ExpandedResourceFolder,
  type ExpandedResourceItem,
  type LessonPlanDayResourceRecord,
} from "@/lesson-plans/model/dayResources";
import {
  listChildFolders,
  listOrgResourceFolders,
  resourceFolderQueryKeys,
} from "@/resources/databridge/folders";
import { listResourceItems } from "@/resources/databridge/items";
import type { ResourceFolderRecord } from "@/resources/databridge/folders";
import type { ResourceItemRecord } from "@/resources/databridge/items";

function toExpandedFolder(folder: ResourceFolderRecord): ExpandedResourceFolder {
  return {
    id: folder.id,
    parentId: folder.parentId,
    name: folder.name,
    parentsCanView: folder.parentsCanView,
    studentsCanView: folder.studentsCanView,
    aclInherit: folder.aclInherit,
  };
}

function toExpandedItem(item: ResourceItemRecord): ExpandedResourceItem {
  return {
    id: item.id,
    folderId: item.folderId,
    title: item.title,
    type: item.type,
    visibility: item.visibility,
    parentsCanView: item.parentsCanView,
    studentsCanView: item.studentsCanView,
    aclInherit: item.aclInherit,
  };
}

async function expandLinkedFolders(
  organizationId: number,
  folderIds: number[],
): Promise<{
  childFoldersByParent: Map<number, ExpandedResourceFolder[]>;
  itemsByFolder: Map<number, ExpandedResourceItem[]>;
}> {
  const childFoldersByParent = new Map<number, ExpandedResourceFolder[]>();
  const itemsByFolder = new Map<number, ExpandedResourceItem[]>();
  const queue = [...folderIds];
  const seen = new Set<number>();
  while (queue.length > 0) {
    const folderId = queue.shift();
    if (folderId == null || seen.has(folderId)) continue;
    seen.add(folderId);
    const [children, items] = await Promise.all([
      listChildFolders({ organizationId, parentId: folderId }),
      listResourceItems({ organizationId, folderId }),
    ]);
    childFoldersByParent.set(folderId, children.map(toExpandedFolder));
    itemsByFolder.set(folderId, items.map(toExpandedItem));
    for (const child of children) queue.push(child.id);
  }
  return { childFoldersByParent, itemsByFolder };
}

export function useLessonPlanResourcePicker(
  courseId: number,
  organizationId: number,
  enabled: boolean,
) {
  const { linksQuery } = useCourseResourceLinks(courseId, enabled);
  const foldersQuery = useQuery({
    queryKey: resourceFolderQueryKeys.all(organizationId),
    queryFn: () => listOrgResourceFolders(organizationId),
    enabled: enabled && Number.isFinite(organizationId),
  });

  const links = linksQuery.data ?? [];
  const linkedFolderIds = links.flatMap((link) =>
    link.folderId != null ? [link.folderId] : [],
  );
  const folderKey = [...linkedFolderIds].sort((a, b) => a - b).join(",");

  const expandQuery = useQuery({
    queryKey: ["lesson-plans", "resource-picker", organizationId, courseId, folderKey],
    queryFn: () => expandLinkedFolders(organizationId, linkedFolderIds),
    enabled: enabled && linksQuery.isSuccess && linkedFolderIds.length > 0,
  });

  const nodes = useMemo(() => {
    const foldersById = new Map<number, ExpandedResourceFolder>();
    for (const folder of foldersQuery.data ?? []) {
      foldersById.set(folder.id, toExpandedFolder(folder));
    }
    for (const children of expandQuery.data?.childFoldersByParent.values() ?? []) {
      for (const child of children) foldersById.set(child.id, child);
    }
    return buildLessonPlanResourcePicker({
      links: links.map(linkSeed),
      foldersById,
      childFoldersByParent: expandQuery.data?.childFoldersByParent ?? new Map(),
      itemsByFolder: expandQuery.data?.itemsByFolder ?? new Map(),
    });
  }, [links, foldersQuery.data, expandQuery.data]);

  const catalog = useMemo(() => catalogFromPicker(nodes), [nodes]);

  return {
    nodes,
    catalog,
    courseHasLinks: links.length > 0,
    loading:
      enabled &&
      (linksQuery.isLoading ||
        foldersQuery.isLoading ||
        (linkedFolderIds.length > 0 && expandQuery.isLoading)),
  };
}

function linkSeed(link: CourseResourceLinkRecord) {
  return {
    folderId: link.folderId,
    itemId: link.itemId,
    title: link.title,
    kind: link.kind,
    familyAccessWarning: link.familyAccessWarning,
  };
}

export function resourceCatalogByKey(
  records: readonly LessonPlanDayResourceRecord[],
): Map<string, LessonPlanDayResourceRecord> {
  const map = new Map<string, LessonPlanDayResourceRecord>();
  for (const record of records) map.set(`${record.kind}:${record.id}`, record);
  return map;
}
