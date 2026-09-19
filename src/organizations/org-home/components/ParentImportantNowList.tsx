import { Link } from "react-router-dom";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";
import type { ParentImportantNowItem } from "@/parent/model/dashboard";
import { materialPath, materialPrintPath } from "@/materials/model/paths";

export function ParentImportantNowList({
  orgSlug,
  items,
}: {
  orgSlug: string;
  items: ParentImportantNowItem[];
}) {
  return (
    <section>
      <h2 className="text-[13px] font-bold text-[var(--amber-deep)]">Important now</h2>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-2.5 border-l-4 border-[var(--amber)] bg-[var(--amber-tint)] py-2 pr-2.5 pl-2.5"
          >
            <Link
              to={materialPath({
                orgSlug,
                courseId: item.courseId,
                unitId: item.unitId,
                materialId: item.materialId,
              })}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block text-[14.5px] font-bold text-[var(--ink)]">
                {item.materialTitle}
              </span>
              {item.materialDescription ? (
                <span className="mt-0.5 block text-[13px] text-[var(--ink-soft)]">
                  {item.materialDescription}
                </span>
              ) : null}
              <span className="mt-1 block text-[12.5px] text-[var(--ink-soft)]">
                {item.courseTitle}
              </span>
            </Link>
            <ButtonLink
              variant="secondary"
              className="shrink-0 px-2.5 py-1.5 text-[12px]"
              to={materialPrintPath({
                orgSlug,
                courseId: item.courseId,
                unitId: item.unitId,
                materialId: item.materialId,
              })}
            >
              <PrinterIcon className="h-4 w-4" aria-hidden />
              Print
            </ButtonLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
