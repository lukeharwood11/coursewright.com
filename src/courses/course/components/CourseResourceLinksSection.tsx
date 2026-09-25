import { useState } from "react";
import { Link } from "react-router-dom";
import { ExclamationTriangleIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
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
        <ul className="mt-2 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
          {links.map((link) => (
            <li key={link.id} className="group flex items-stretch">
              <Link
                to={linkTo(orgSlug, link)}
                className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3 hover:bg-[var(--green-tint)]"
              >
                <span className="text-[14.5px] font-semibold text-[var(--ink)]">
                  {link.title}
                </span>
                <span className="text-[12.5px] text-[var(--ink-soft)]">
                  {kindLabel(link.kind)}
                </span>
                {canEdit && link.familyAccessWarning ? (
                  <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-[var(--amber-deep)]">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {link.familyAccessWarning}
                  </span>
                ) : null}
              </Link>
              {canEdit ? (
                <button
                  type="button"
                  className="mr-2 shrink-0 self-center rounded-[6px] p-1.5 text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  aria-label={`Remove link to ${link.title}`}
                  disabled={removeLink.isPending}
                  onClick={() => removeLink.mutate(link.id)}
                >
                  <XMarkIcon className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
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
