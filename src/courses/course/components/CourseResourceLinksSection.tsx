import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  LinkIcon,
  PaperClipIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { useToastOnError } from "@/ui/useToastOnError";
import type { CourseResourceLinkRecord } from "@/courses/databridge/courseResourceLinks";
import { useCourseResourceLinks } from "@/courses/course/hooks/useCourseResourceLinks";
import { resourceItemTypeLabel, type ResourceItemType } from "@/resources/model/kinds";
import {
  resourceBrowsePath,
  resourceItemPath,
} from "@/resources/model/paths";
import {
  LinkResourceDialog,
  linkedResourceIdSets,
} from "./LinkResourceDialog";

function linkTo(orgSlug: string, link: CourseResourceLinkRecord): string {
  if (link.folderId != null) {
    return resourceBrowsePath(orgSlug, link.folderId);
  }
  return resourceItemPath(orgSlug, link.itemId!);
}

function kindLabel(kind: CourseResourceLinkRecord["kind"]): string {
  if (kind === "folder") return "Folder";
  return resourceItemTypeLabel(kind as ResourceItemType);
}

function linkKindIcon(link: CourseResourceLinkRecord) {
  if (link.kind === "folder") return FolderIcon;
  if (link.kind === "document") return DocumentTextIcon;
  if (link.kind === "link") return LinkIcon;
  return PaperClipIcon;
}

export function CourseResourceLinksSection({
  orgSlug,
  organizationId,
  courseId,
  canEdit,
}: {
  orgSlug: string;
  organizationId: number;
  courseId: number;
  canEdit: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { linksQuery, addLink, removeLink } = useCourseResourceLinks(
    courseId,
    true,
  );
  useToastOnError(linksQuery.error?.message ?? null);
  useToastOnError(addLink.error?.message ?? null);
  useToastOnError(removeLink.error?.message ?? null);

  const links = linksQuery.data ?? [];
  const { folderIds, itemIds } = linkedResourceIdSets(links);

  if (!canEdit && (linksQuery.isLoading || links.length === 0)) {
    return null;
  }

  return (
    <section className="mt-8">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">
        Linked resources
      </h2>

      {linksQuery.isLoading ? (
        <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">Loading…</p>
      ) : links.length > 0 ? (
        <section
          className="mt-2 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]"
        >
          <ul>
            {links.map((link) => {
              const Icon = linkKindIcon(link);
              return (
                <li
                  key={link.id}
                  className="flex items-center gap-2 border-t border-[var(--line-soft)] px-4 py-2.5 first:border-t-0"
                >
                  <Icon
                    className="h-5 w-5 shrink-0 text-[var(--ink-faint)]"
                    aria-hidden
                  />
                  <Link to={linkTo(orgSlug, link)} className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-[var(--ink)]">
                      {link.title}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="slate">{kindLabel(link.kind)}</Badge>
                      {canEdit && link.familyAccessWarning ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--amber-deep)]">
                          <ExclamationTriangleIcon
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden
                          />
                          {link.familyAccessWarning}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                  {canEdit ? (
                    <button
                      type="button"
                      className="shrink-0 rounded-[6px] p-1.5 text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                      aria-label={`Remove link to ${link.title}`}
                      disabled={removeLink.isPending}
                      onClick={() => removeLink.mutate(link.id)}
                    >
                      <XMarkIcon className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {canEdit ? (
        <div className="mt-3">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => setPickerOpen(true)}
          >
            <PlusIcon className="h-5 w-5" aria-hidden />
            Link resource
          </Button>
        </div>
      ) : null}

      <LinkResourceDialog
        open={pickerOpen}
        organizationId={organizationId}
        linkedFolderIds={folderIds}
        linkedItemIds={itemIds}
        onClose={() => setPickerOpen(false)}
        onLinkFolder={(folderId) => addLink.mutate({ folderId })}
        onLinkItem={(itemId) => addLink.mutate({ itemId })}
        pending={addLink.isPending}
        error={addLink.error?.message ?? null}
      />
    </section>
  );
}
