import { DocumentIcon, DocumentTextIcon, LinkIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { ButtonLink } from "@/ui/Button";
import type { BulletinMaterialRecord } from "@/bulletins/databridge/bulletins";
import { materialKindLabel } from "@/materials/model/kind";
import { materialPath, materialPrintPath } from "@/materials/model/paths";
import { isPublished } from "@/materials/model/visibility";

export function BulletinMaterialList({
  orgSlug,
  courseId,
  materials,
  showUnpublished,
}: {
  orgSlug: string;
  courseId: number;
  materials: BulletinMaterialRecord[];
  showUnpublished: boolean;
}) {
  if (materials.length === 0) {
    return (
      <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        No materials are listed on this note yet.
      </p>
    );
  }

  return (
    <ul className="mt-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
      {materials.map((material) => {
        const Icon =
          material.kind === "link"
            ? LinkIcon
            : material.kind === "file"
              ? DocumentIcon
              : DocumentTextIcon;
        return (
          <li
            key={material.id}
            className="flex items-center gap-2 border-t border-[var(--line-soft)] px-4 py-2.5 first:border-t-0"
          >
            <Icon className="h-5 w-5 shrink-0 text-[var(--ink-faint)]" aria-hidden />
            <Link
              to={materialPath({
                orgSlug,
                courseId,
                unitId: material.unitId,
                materialId: material.id,
              })}
              className="min-w-0 flex-1"
            >
              <span className="block truncate text-[14.5px] font-semibold text-[var(--ink)]">
                {material.title}
              </span>
              {material.description ? (
                <span className="block truncate text-[12.5px] text-[var(--ink-soft)]">
                  {material.description}
                </span>
              ) : null}
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="slate">{materialKindLabel(material.kind)}</Badge>
                {showUnpublished && !isPublished(material.visibility) ? (
                  <Badge variant="amber">Unpublished</Badge>
                ) : null}
              </span>
            </Link>
            <ButtonLink
              variant="secondary"
              to={materialPrintPath({
                orgSlug,
                courseId,
                unitId: material.unitId,
                materialId: material.id,
              })}
              className="shrink-0 px-2.5 py-1.5 text-[12px]"
            >
              <PrinterIcon className="h-4 w-4" aria-hidden />
              Print
            </ButtonLink>
          </li>
        );
      })}
    </ul>
  );
}
