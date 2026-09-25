import {
  previewResourceAudience,
  type FolderAclSource,
  type ResourceAudience,
} from "@/resources/model/access";
import type { ResourceVisibility } from "@/resources/model/kinds";

/** Staff-only hint when a course link points at Resources families cannot open. */
export function courseResourceLinkFamilyAccessWarning(args: {
  kind: "folder" | "item";
  visibility: ResourceVisibility | null;
  audience: ResourceAudience;
  unresolved: boolean;
}): string | null {
  if (args.unresolved) {
    return "Access settings could not be verified.";
  }
  if (args.kind === "item" && args.visibility !== "published") {
    return "Unpublished — families can’t open this resource.";
  }
  const { parentsCanView, studentsCanView } = args.audience;
  if (!parentsCanView && !studentsCanView) {
    return "Not shared with parents or students in Resources.";
  }
  if (!parentsCanView) {
    return "Not shared with parents in Resources.";
  }
  if (!studentsCanView) {
    return "Not shared with students in Resources.";
  }
  return null;
}

export function effectiveAudienceForCourseLink(args: {
  kind: "folder" | "item";
  folderId: number | null;
  parentId: number | null;
  aclInherit: boolean;
  draft: ResourceAudience;
  foldersById: Map<number, FolderAclSource>;
}): { audience: ResourceAudience; unresolved: boolean } {
  const preview = previewResourceAudience({
    kind: args.kind,
    id: args.kind === "folder" ? (args.folderId ?? 0) : 0,
    parentId: args.parentId,
    folderId: args.folderId,
    inherit: args.aclInherit,
    draft: args.draft,
    foldersById: args.foldersById,
  });
  return { audience: preview.audience, unresolved: preview.unresolved };
}
