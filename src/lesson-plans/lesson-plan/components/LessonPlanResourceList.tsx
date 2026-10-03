import { DocumentIcon, DocumentTextIcon, ExclamationTriangleIcon, FolderIcon, LinkIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import type { LessonPlanDayResourceRecord } from "@/lesson-plans/model/dayResources";
import { resourceItemTypeLabel } from "@/resources/model/kinds";
import { resourceFolderPath, resourceItemPath } from "@/resources/model/paths";

function resourceHref(orgSlug: string, resource: LessonPlanDayResourceRecord): string {
  return resource.kind === "folder"
    ? resourceFolderPath(orgSlug, resource.id)
    : resourceItemPath(orgSlug, resource.id);
}

export function LessonPlanResourceList({
  orgSlug,
  resources,
  showWarning,
}: {
  orgSlug: string;
  resources: LessonPlanDayResourceRecord[];
  showWarning: boolean;
}) {
  if (resources.length === 0) return null;

  return (
    <ul className="mt-2 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
      {resources.map((resource) => {
        const Icon =
          resource.itemType === "folder"
            ? FolderIcon
            : resource.itemType === "link"
              ? LinkIcon
              : resource.itemType === "file"
                ? DocumentIcon
                : DocumentTextIcon;
        const kindLabel =
          resource.itemType === "folder" ? "Folder" : resourceItemTypeLabel(resource.itemType);
        return (
          <li
            key={`${resource.kind}:${resource.id}`}
            className="flex items-center gap-2 border-t border-[var(--line-soft)] px-3 py-2 first:border-t-0"
          >
            <Icon className="h-5 w-5 shrink-0 text-[var(--ink-faint)]" aria-hidden />
            <Link to={resourceHref(orgSlug, resource)} className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-[var(--ink)]">
                {resource.title}
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="slate">{kindLabel}</Badge>
                {showWarning && resource.familyAccessWarning ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--amber-deep)]">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {resource.familyAccessWarning}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
