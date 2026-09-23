import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderOpenIcon,
  LinkIcon,
  ListBulletIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { MaterialRecord } from "@/materials/databridge/materials";
import { materialPath } from "@/materials/model/paths";
import type { MaterialKind } from "@/materials/model/kind";
import type { QuizRecord } from "@/quizzes/databridge/quizzes";
import { mergeOutline } from "@/quizzes/model/outline";
import { quizPath } from "@/quizzes/model/paths";
import type { UnitRecord } from "@/units/databridge/units";
import { unitPath } from "@/units/model/paths";
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

function MaterialKindIcon({ kind }: { kind: MaterialKind }) {
  const Icon =
    kind === "link" ? LinkIcon : kind === "file" ? DocumentIcon : DocumentTextIcon;
  return <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--ink-faint)]" aria-hidden />;
}

function MaterialLink({
  orgSlug,
  courseId,
  unitId,
  material,
}: {
  orgSlug: string;
  courseId: number;
  unitId: number | null;
  material: MaterialRecord;
}) {
  return (
    <Link
      to={materialPath({
        orgSlug,
        courseId,
        unitId,
        materialId: material.id,
      })}
      className="flex min-w-0 items-center gap-1.5 rounded-[4px] px-1.5 py-1 text-[12.5px] font-semibold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
      title={material.title}
    >
      <MaterialKindIcon kind={material.kind} />
      <span className="min-w-0 truncate">{material.title}</span>
    </Link>
  );
}

function UnitBranch({
  orgSlug,
  courseId,
  unit,
  materials,
  quizzes,
}: {
  orgSlug: string;
  courseId: number;
  unit: UnitRecord;
  materials: MaterialRecord[];
  quizzes: QuizRecord[];
}) {
  const [open, setOpen] = useState(true);
  const href = unitPath(orgSlug, courseId, unit.id);
  const Folder = open ? FolderOpenIcon : FolderIcon;
  const outline = mergeOutline(materials, quizzes);
  const materialById = new Map(materials.map((material) => [material.id, material]));
  const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));

  return (
    <li>
      <div className="flex min-w-0 items-center gap-0.5">
        <button
          type="button"
          className="rounded-[4px] p-0.5 text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green)]"
          aria-expanded={open}
          aria-label={open ? `Collapse ${unit.title}` : `Expand ${unit.title}`}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? (
            <ChevronDownIcon className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
        <Link
          to={href}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[4px] px-1.5 py-1 text-[12.5px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
          title={unit.title}
        >
          <Folder className="h-3.5 w-3.5 shrink-0 text-[var(--green)]" aria-hidden />
          <span className="min-w-0 truncate">{unit.title}</span>
        </Link>
      </div>
      {open ? (
        <ul className="ml-[1.125rem] border-l border-[var(--line-soft)] pl-2">
          {outline.length === 0 ? (
            <li className="px-1.5 py-1 text-[12px] text-[var(--ink-faint)]">
              Empty
            </li>
          ) : (
            outline.map((item) => {
              if (item.kind === "quiz") {
                const quiz = quizById.get(item.id);
                if (!quiz) return null;
                return (
                  <li key={`quiz-${quiz.id}`}>
                    <Link
                      to={quizPath({
                        orgSlug,
                        courseId,
                        unitId: unit.id,
                        quizId: quiz.id,
                      })}
                      className="flex min-w-0 items-center gap-1.5 rounded-[4px] px-1.5 py-1 text-[12.5px] font-semibold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
                    >
                      <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 shrink-0 text-[var(--ink-faint)]" aria-hidden />
                      <span className="min-w-0 truncate">{quiz.title}</span>
                    </Link>
                  </li>
                );
              }
              const material = materialById.get(item.id);
              if (!material) return null;
              return (
                <li key={material.id}>
                  <MaterialLink
                    orgSlug={orgSlug}
                    courseId={courseId}
                    unitId={unit.id}
                    material={material}
                  />
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </li>
  );
}

export function CourseOutline({
  orgSlug,
  courseId,
  units,
  topLevelMaterials,
  materialsByUnitId,
  quizzesByUnitId,
  open,
  onClose,
}: {
  orgSlug: string;
  courseId: number;
  units: UnitRecord[];
  topLevelMaterials: MaterialRecord[];
  materialsByUnitId: Record<number, MaterialRecord[]>;
  quizzesByUnitId: Record<number, QuizRecord[]>;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const empty =
    topLevelMaterials.length === 0 && units.length === 0;

  return (
    <aside className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--line-soft)] px-3 py-2.5">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Outline</h2>
        <button
          type="button"
          className="rounded-[4px] p-1 text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green)]"
          aria-label="Hide outline"
          onClick={onClose}
        >
          <XMarkIcon className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <nav className="max-h-[min(28rem,60vh)] overflow-y-auto px-2 py-2" aria-label="Course outline">
        {empty ? (
          <p className="px-1.5 py-1 text-[12.5px] text-[var(--ink-soft)]">
            Units and materials will show up here.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {topLevelMaterials.map((material) => (
              <li key={material.id}>
                <MaterialLink
                  orgSlug={orgSlug}
                  courseId={courseId}
                  unitId={null}
                  material={material}
                />
              </li>
            ))}
            {units.map((unit) => (
              <UnitBranch
                key={unit.id}
                orgSlug={orgSlug}
                courseId={courseId}
                unit={unit}
                materials={materialsByUnitId[unit.id] ?? []}
                quizzes={quizzesByUnitId[unit.id] ?? []}
              />
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}

export function CourseOutlineToggle({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--line-soft)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] font-bold text-[var(--ink-soft)] hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
      onClick={onOpen}
    >
      <ListBulletIcon className="h-4 w-4" aria-hidden />
      Show outline
    </button>
  );
}
