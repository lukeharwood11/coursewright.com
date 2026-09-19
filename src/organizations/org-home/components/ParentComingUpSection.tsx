import { Link } from "react-router-dom";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";
import type { ParentDashboardNextItem } from "@/parent/model/dashboard";
import { formatMaterialDate } from "@/parent/model/thisWeek";
import { materialPath, materialPrintPath } from "@/materials/model/paths";

export function ParentComingUpSection({
  orgSlug,
  nextAssigned,
  nextDue,
  showStudent,
}: {
  orgSlug: string;
  nextAssigned: ParentDashboardNextItem | null;
  nextDue: ParentDashboardNextItem | null;
  showStudent: boolean;
}) {
  return (
    <section>
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Coming up</h2>
      <p className="mt-0.5 text-[13px] text-[var(--ink-faint)]">
        What’s next to work on, and what’s due soon.
      </p>
      <ul className="mt-2 divide-y divide-[var(--line-soft)] border-y border-[var(--line-soft)]">
        {nextAssigned ? (
          <ComingUpRow
            orgSlug={orgSlug}
            label="Assigned next"
            dateLabel={`Assigned ${formatMaterialDate(nextAssigned.sortDate)}`}
            dateTone="assigned"
            item={nextAssigned}
            showStudent={showStudent}
          />
        ) : null}
        {nextDue ? (
          <ComingUpRow
            orgSlug={orgSlug}
            label="Due next"
            dateLabel={`Due ${formatMaterialDate(nextDue.sortDate)}`}
            dateTone="due"
            item={nextDue}
            showStudent={showStudent}
          />
        ) : null}
      </ul>
    </section>
  );
}

function ComingUpRow({
  orgSlug,
  label,
  dateLabel,
  dateTone,
  item,
  showStudent,
}: {
  orgSlug: string;
  label: string;
  dateLabel: string;
  dateTone: "assigned" | "due";
  item: ParentDashboardNextItem;
  showStudent: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-[var(--ink-faint)]">{label}</p>
        <Link
          to={materialPath({
            orgSlug,
            courseId: item.courseId,
            unitId: item.material.unitId,
            materialId: item.material.id,
          })}
          className="mt-0.5 block min-w-0 text-left"
        >
          <span className="block text-[15px] font-bold text-[var(--ink)]">
            {item.material.title}
          </span>
          <span
            className={[
              "mt-0.5 block text-[12.5px] font-bold",
              dateTone === "due" ? "text-[var(--amber-deep)]" : "text-[var(--slate)]",
            ].join(" ")}
          >
            {dateLabel}
          </span>
          <span className="block text-[12.5px] text-[var(--ink-soft)]">
            {showStudent ? `${item.studentName} · ` : ""}
            {item.courseTitle}
          </span>
        </Link>
      </div>
      <ButtonLink
        variant="secondary"
        className="mt-3 shrink-0 px-2.5 py-1.5 text-[12px]"
        to={materialPrintPath({
          orgSlug,
          courseId: item.courseId,
          unitId: item.material.unitId,
          materialId: item.material.id,
        })}
      >
        <PrinterIcon className="h-4 w-4" aria-hidden />
        Print
      </ButtonLink>
    </li>
  );
}
