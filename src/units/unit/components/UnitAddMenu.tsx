import { useId, useRef, useState } from "react";
import {
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { AnchoredPopup } from "@/ui/AnchoredPopup";
import { AddMaterialForm } from "@/materials/material/components/AddMaterialForm";
import { AddQuizForm } from "@/quizzes/quiz/components/AddQuizForm";

const segmentIdle =
  "inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)] motion-reduce:transition-none";

const segmentActive =
  "inline-flex items-center gap-1.5 bg-[var(--green-tint)] px-3 py-2 text-[13px] font-bold text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)]";

const segmentShell =
  "inline-flex overflow-hidden rounded-[6px] border border-[var(--line)] bg-[var(--surface)]";

const menuItemClass =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-bold text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:bg-[var(--green-tint)] focus-visible:outline-none";

type AddMode = "material" | "quiz";

export function UnitAddMenu({
  organizationId,
  orgSlug,
  courseId,
  unitId,
  fromUnitPage = false,
}: {
  organizationId: number;
  orgSlug: string;
  courseId: number;
  unitId: number;
  fromUnitPage?: boolean;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<AddMode | null>(null);

  function choose(next: AddMode) {
    setMenuOpen(false);
    setMode(next);
  }

  if (mode === "material") {
    return (
      <AddMaterialForm
        organizationId={organizationId}
        orgSlug={orgSlug}
        courseId={courseId}
        unitId={unitId}
        fromUnitPage={fromUnitPage}
        label="Add material"
        formOnly
        onCancel={() => setMode(null)}
      />
    );
  }

  if (mode === "quiz") {
    return (
      <AddQuizForm
        organizationId={organizationId}
        orgSlug={orgSlug}
        courseId={courseId}
        unitId={unitId}
        fromUnitPage={fromUnitPage}
        formOnly
        onCancel={() => setMode(null)}
      />
    );
  }

  return (
    <div className={segmentShell}>
      <button
        ref={buttonRef}
        type="button"
        className={menuOpen ? segmentActive : segmentIdle}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <PlusIcon className="h-4 w-4" aria-hidden />
        Add
        <ChevronDownIcon className="h-3.5 w-3.5 opacity-70" aria-hidden />
      </button>
      <AnchoredPopup
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRef={buttonRef}
        id={menuId}
        label="Add to unit"
        preferredAlign="start"
        preferredSide="bottom"
        gap={4}
        className="min-w-[12rem]"
      >
        <div className="py-1" role="none">
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => choose("material")}
          >
            <span className="text-[var(--ink-soft)]" aria-hidden>
              <DocumentTextIcon className="h-4 w-4" />
            </span>
            Material
          </button>
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => choose("quiz")}
          >
            <span className="text-[var(--ink-soft)]" aria-hidden>
              <ClipboardDocumentCheckIcon className="h-4 w-4" />
            </span>
            Quiz
          </button>
        </div>
      </AnchoredPopup>
    </div>
  );
}
