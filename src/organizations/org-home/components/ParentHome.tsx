import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";
import { ButtonLink } from "@/ui/Button";
import { toastNotImplemented } from "@/ui/toast";
import {
  filterParentDashboard,
  toggleStudentId,
  type ParentDashboard,
  type ParentDashboardMaterial,
  type ParentDashboardNextItem,
  type ParentDashboardStudent,
  type ParentImportantNowItem,
} from "@/parent/model/dashboard";
import { formatMaterialDate } from "@/parent/model/thisWeek";
import { materialPath, materialPrintPath } from "@/materials/model/paths";
import { coursePath } from "@/courses/model/paths";
import { printThisWeekPath } from "@/print/model/paths";

export function ParentHome({
  firstName,
  orgSlug,
  dashboard,
  loading,
  error,
}: {
  firstName: string;
  orgSlug: string;
  dashboard: ParentDashboard | null;
  loading: boolean;
  error: string | null;
}) {
  const [activeIds, setActiveIds] = useState<number[] | null>(null);
  const weekLabel = dashboard?.week.label ?? "This week";
  const allStudentIds = useMemo(
    () => dashboard?.students.map((student) => student.id) ?? [],
    [dashboard],
  );
  const selectedIds = activeIds ?? allStudentIds;
  const visible = dashboard
    ? filterParentDashboard(dashboard, selectedIds)
    : null;
  const printTo =
    selectedIds.length > 0 && selectedIds.length < allStudentIds.length
      ? printThisWeekPath(orgSlug, selectedIds)
      : printThisWeekPath(orgSlug);

  return (
    <div className="mx-auto max-w-2xl px-5 pb-24 pt-8 md:px-8 md:pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[22px] font-semibold leading-snug text-[var(--ink)] md:text-[24px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Hi, {firstName}
          </h1>
          <p className="mt-1.5 text-[14px] text-[var(--ink-soft)]">{weekLabel}</p>
        </div>
        {selectedIds.length > 0 ? (
          <ButtonLink variant="secondary" to={printTo}>
            <PrinterIcon className="h-5 w-5" aria-hidden />
            Print this week
          </ButtonLink>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-[6px] border border-[var(--line)] px-3 py-[11px] text-[13px] font-bold text-[var(--ink-faint)]">
            <PrinterIcon className="h-5 w-5" aria-hidden />
            Print this week
          </span>
        )}
      </header>

      <p className="mt-3 text-[13px]">
        <Link
          to="/my"
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Switch organization
        </Link>
      </p>

      {loading ? (
        <p className="mt-8 text-[14px] text-[var(--ink-soft)]">Loading this week…</p>
      ) : null}

      {error ? (
        <p className="mt-8 text-[13.5px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}

      {dashboard && visible && !loading ? (
        <ParentDashboardBody
          orgSlug={orgSlug}
          full={dashboard}
          visible={visible}
          selectedIds={selectedIds}
          onToggleStudent={(id) =>
            setActiveIds(toggleStudentId(selectedIds, id))
          }
        />
      ) : null}

      <nav
        className="cw-org-chrome fixed inset-x-0 bottom-0 border-t border-[var(--line-soft)] bg-[var(--surface)] md:hidden"
        aria-label="Parent"
      >
        <div className="mx-auto grid max-w-lg grid-cols-2">
          <span className="py-3 text-center text-[11.5px] font-bold text-[var(--green)]">
            This week
          </span>
          <button
            type="button"
            className="py-3 text-center text-[11.5px] font-bold text-[var(--ink-faint)]"
            onClick={() => toastNotImplemented("Progress")}
          >
            Progress
          </button>
        </div>
      </nav>
    </div>
  );
}

function ParentDashboardBody({
  orgSlug,
  full,
  visible,
  selectedIds,
  onToggleStudent,
}: {
  orgSlug: string;
  full: ParentDashboard;
  visible: ParentDashboard;
  selectedIds: number[];
  onToggleStudent: (id: number) => void;
}) {
  if (!full.hasActiveEnrollment) {
    return (
      <p className="mt-8 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        You’re not on a course yet. When your co-op adds you, this week’s
        materials will show up here.
      </p>
    );
  }

  const showTags = full.students.length > 1;
  const showStudentHeaders = visible.students.length > 1;
  const datedCount = visible.students.reduce(
    (count, student) =>
      count +
      student.courses.reduce((inner, course) => inner + course.materials.length, 0),
    0,
  );
  const hasComingUp = Boolean(visible.nextAssignedItem || visible.nextDueItem);

  if (showTags && selectedIds.length === 0) {
    return (
      <div className="mt-8 flex flex-col gap-6">
        <StudentTags
          students={full.students}
          selectedIds={selectedIds}
          onToggle={onToggleStudent}
        />
        <p className="text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          Choose a student at the top to see their work.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      {showTags ? (
        <StudentTags
          students={full.students}
          selectedIds={selectedIds}
          onToggle={onToggleStudent}
        />
      ) : null}

      {hasComingUp ? (
        <ComingUpSection
          orgSlug={orgSlug}
          nextAssigned={visible.nextAssignedItem}
          nextDue={visible.nextDueItem}
          showStudent={showStudentHeaders}
        />
      ) : null}

      {visible.importantNow.length > 0 ? (
        <ImportantNowList orgSlug={orgSlug} items={visible.importantNow} />
      ) : null}

      <section>
        <div className="mb-3">
          <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">This week</h2>
          <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
            Work assigned for this week, and anything due this week.
          </p>
        </div>

        {datedCount === 0 ? (
          <p className="text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
            Nothing assigned or due this week. Check back soon, or open a course
            when something’s ready.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {visible.students.map((student) => (
              <StudentWeek
                key={student.id}
                orgSlug={orgSlug}
                student={student}
                showHeader={showStudentHeaders}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StudentTags({
  students,
  selectedIds,
  onToggle,
}: {
  students: ParentDashboardStudent[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Students">
      {students.map((student) => {
        const active = selectedIds.includes(student.id);
        return (
          <button
            key={student.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(student.id)}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-bold",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
              active
                ? "border-[var(--green)] bg-[var(--green-tint)] text-[var(--green-deep)]"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-faint)]",
            ].join(" ")}
          >
            <Avatar name={student.name} size={20} />
            {student.name}
          </button>
        );
      })}
    </div>
  );
}

function ComingUpSection({
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
      <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
        What’s next to work on, and what’s due soon.
      </p>
      <ul className="mt-3 divide-y divide-[var(--line-soft)] border-y border-[var(--line-soft)]">
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
    <li className="flex items-start gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-[var(--ink-faint)]">{label}</p>
        <Link
          to={materialPath({
            orgSlug,
            courseId: item.courseId,
            unitId: item.material.unitId,
            materialId: item.material.id,
          })}
          className="mt-1 block min-w-0 text-left"
        >
          <span className="block text-[15px] font-bold text-[var(--ink)]">
            {item.material.title}
          </span>
          <span
            className={[
              "mt-1 block text-[12.5px] font-bold",
              dateTone === "due" ? "text-[var(--amber-deep)]" : "text-[var(--slate)]",
            ].join(" ")}
          >
            {dateLabel}
          </span>
          <span className="mt-0.5 block text-[12.5px] text-[var(--ink-soft)]">
            {showStudent ? `${item.studentName} · ` : ""}
            {item.courseTitle}
          </span>
        </Link>
      </div>
      <ButtonLink
        variant="secondary"
        className="mt-5 shrink-0 px-2.5 py-1.5 text-[12px]"
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

function ImportantNowList({
  orgSlug,
  items,
}: {
  orgSlug: string;
  items: ParentImportantNowItem[];
}) {
  return (
    <section>
      <h2 className="text-[13px] font-bold text-[var(--amber-deep)]">Important now</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 border-l-4 border-[var(--amber)] bg-[var(--amber-tint)] py-3 pr-3 pl-3"
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

function StudentWeek({
  orgSlug,
  student,
  showHeader,
}: {
  orgSlug: string;
  student: ParentDashboardStudent;
  showHeader: boolean;
}) {
  return (
    <div>
      {showHeader ? (
        <div className="mb-3 flex items-center gap-2">
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

      <div className="flex flex-col gap-4">
        {student.courses.map((course) => (
          <div key={course.id}>
            <Link
              to={coursePath(orgSlug, course.id)}
              className="text-[14.5px] font-extrabold text-[var(--ink)] hover:text-[var(--green-deep)]"
            >
              {course.title}
            </Link>
            {course.materials.length === 0 ? (
              <p className="mt-2 text-[13.5px] text-[var(--ink-faint)]">
                Nothing assigned or due this week.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-[var(--line-soft)] border-y border-[var(--line-soft)]">
                {course.materials.map((material) => (
                  <MaterialWeekRow
                    key={material.id}
                    orgSlug={orgSlug}
                    courseId={course.id}
                    material={material}
                  />
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
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
    <li className="flex items-start gap-3 py-3">
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
    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
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
