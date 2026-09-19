import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";
import { ButtonLink } from "@/ui/Button";
import type {
  ParentDashboardMaterial,
  ParentDashboardStudent,
} from "@/parent/model/dashboard";
import { formatMaterialDate } from "@/parent/model/thisWeek";
import { materialPath, materialPrintPath } from "@/materials/model/paths";
import { coursePath } from "@/courses/model/paths";

export function ParentStudentWeek({
  orgSlug,
  student,
  showHeader,
  lead = null,
}: {
  orgSlug: string;
  student: ParentDashboardStudent;
  showHeader: boolean;
  lead?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {showHeader ? (
        <div className="mb-2 flex items-center gap-2">
          <Avatar name={student.name} size={28} />
          <p className="text-[15px] font-extrabold text-[var(--ink)]">{student.name}</p>
          {student.gradeLevel ? (
            <Badge variant="neutral">{student.gradeLevel}</Badge>
          ) : null}
        </div>
      ) : null}

      {!student.hasActiveEnrollment ? (
        <p className="text-[13.5px] text-[var(--ink-soft)]">
          Not in an active course yet.
        </p>
      ) : null}

      {lead}

      {student.courses.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {student.courses.map((course) => (
            <div
              key={course.id}
              className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]"
            >
              <Link
                to={coursePath(orgSlug, course.id)}
                className="block px-4 py-3 text-[14.5px] font-extrabold text-[var(--ink)] hover:text-[var(--green-deep)]"
              >
                {course.title}
              </Link>
              <ul className="border-t border-[var(--line-soft)] divide-y divide-[var(--line-soft)]">
                {course.materials.map((material) => (
                  <MaterialWeekRow
                    key={material.id}
                    orgSlug={orgSlug}
                    courseId={course.id}
                    material={material}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MaterialWeekRow({
  orgSlug,
  courseId,
  material,
}: {
  orgSlug: string;
  courseId: number;
  material: ParentDashboardMaterial;
}) {
  return (
    <li className="flex items-start gap-2.5 px-4 py-2.5">
      <Link
        to={materialPath({
          orgSlug,
          courseId,
          unitId: material.unitId,
          materialId: material.id,
        })}
        className="min-w-0 flex-1 text-left"
      >
        <span className="block text-[14.5px] font-semibold text-[var(--ink)]">
          {material.title}
        </span>
        <MaterialDateLabels material={material} />
      </Link>
      <ButtonLink
        variant="secondary"
        className="shrink-0 px-2.5 py-1.5 text-[12px]"
        to={materialPrintPath({
          orgSlug,
          courseId,
          unitId: material.unitId,
          materialId: material.id,
        })}
      >
        <PrinterIcon className="h-4 w-4" aria-hidden />
        Print
      </ButtonLink>
    </li>
  );
}

function MaterialDateLabels({
  material,
}: {
  material: ParentDashboardMaterial;
}) {
  if (!material.assignedDate && !material.dueDate) return null;

  return (
    <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
      {material.assignedDate ? (
        <span className="text-[12.5px] font-bold text-[var(--slate)]">
          Assigned {formatMaterialDate(material.assignedDate)}
        </span>
      ) : null}
      {material.dueDate ? (
        <span className="text-[12.5px] font-bold text-[var(--amber-deep)]">
          Due {formatMaterialDate(material.dueDate)}
        </span>
      ) : null}
    </span>
  );
}
