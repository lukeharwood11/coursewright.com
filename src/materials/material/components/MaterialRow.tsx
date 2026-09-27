import {
  ClipboardDocumentListIcon,
  DocumentIcon,
  DocumentTextIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { ButtonLink } from "@/ui/Button";
import { formatIsoDate } from "@/courses/model/dates";
import { materialKindLabel, type MaterialKind } from "@/materials/model/kind";
import {
  materialWorkTypeLabel,
  type MaterialWorkType,
} from "@/materials/model/workType";
import { materialLocationState } from "@/materials/model/navigation";
import { materialPath, materialPrintPath } from "@/materials/model/paths";
import { isPublished, type MaterialVisibility } from "@/materials/model/visibility";

export function MaterialRow({
  orgSlug,
  courseId,
  unitId,
  materialId,
  title,
  description,
  kind,
  workType,
  scheduledDate,
  dueDate,
  importantNow,
  visibility,
  fromUnitPage = false,
  as: Root = "li",
  className,
}: {
  orgSlug: string;
  courseId: number;
  unitId: number | null;
  fromUnitPage?: boolean;
  materialId: number;
  title: string;
  description: string;
  kind: MaterialKind;
  workType: MaterialWorkType;
  scheduledDate: string | null;
  dueDate?: string | null;
  importantNow: boolean;
  visibility: MaterialVisibility;
  /** Use `div` when already inside an outer `<li>` (e.g. unit reorder row). */
  as?: "li" | "div";
  className?: string;
}) {
  const href = materialPath({ orgSlug, courseId, unitId, materialId });
  const printHref = materialPrintPath({ orgSlug, courseId, unitId, materialId });
  const KindIcon =
    kind === "link" ? LinkIcon : kind === "file" ? DocumentIcon : DocumentTextIcon;
  const Icon = workType === "assignment" ? ClipboardDocumentListIcon : KindIcon;

  return (
    <Root
      className={[
        "flex items-center gap-2 border-t border-[var(--line-soft)] px-4 py-2.5 first:border-t-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className="h-5 w-5 shrink-0 text-[var(--ink-faint)]" aria-hidden />
      <Link
        to={href}
        state={materialLocationState(fromUnitPage)}
        className="min-w-0 flex-1"
      >
        <span className="block truncate text-[14px] font-semibold text-[var(--ink)]">
          {title}
        </span>
        {description ? (
          <span className="block truncate text-[12.5px] text-[var(--ink-soft)]">
            {description}
          </span>
        ) : null}
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant={workType === "assignment" ? "amber" : "green"}>
            {materialWorkTypeLabel(workType)}
          </Badge>
          <Badge variant="slate">{materialKindLabel(kind)}</Badge>
          {importantNow ? <Badge variant="amberSolid">Important now</Badge> : null}
          {!isPublished(visibility) ? (
            <Badge variant="amber">Unpublished</Badge>
          ) : null}
          {workType === "material" && scheduledDate ? (
            <span className="text-[12px] font-bold text-[var(--slate)]">
              Available {formatIsoDate(scheduledDate)}
            </span>
          ) : null}
          {workType === "assignment" && scheduledDate ? (
            <span className="text-[12px] font-bold text-[var(--slate)]">
              Focus {formatIsoDate(scheduledDate)}
            </span>
          ) : null}
          {workType === "assignment" && dueDate ? (
            <span className="text-[12px] font-bold text-[var(--amber-deep)]">
              Due {formatIsoDate(dueDate)}
            </span>
          ) : null}
        </span>
      </Link>
      <ButtonLink
        variant="secondary"
        to={printHref}
        className="shrink-0 px-2.5 py-1.5 text-[12px]"
      >
        <PrinterIcon className="h-4 w-4" aria-hidden />
        Print
      </ButtonLink>
    </Root>
  );
}
