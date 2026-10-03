import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/ui/Button";
import { Tab, TabList } from "@/ui/Tabs";
import {
  linkedContentSummary,
  type LessonPlanContentLinkPane,
  type LessonPlanDayResourceRef,
  type LessonPlanResourcePickerNode,
} from "@/lesson-plans/model/dayResources";
import type { MaterialRecord } from "@/materials/databridge/materials";
import type { UnitRecord } from "@/units/databridge/units";
import { LessonPlanMaterialPicker } from "./LinkMaterialsModal";
import { LessonPlanResourcePicker } from "./LinkResourcesModal";

export function LinkContentModal({
  open,
  dayLabel,
  materials,
  units,
  selectedMaterialIds,
  onToggleMaterial,
  resourceNodes,
  selectedResources,
  courseHasResourceLinks,
  resourcesLoading,
  onToggleResource,
  onClose,
}: {
  open: boolean;
  dayLabel: string;
  materials: MaterialRecord[];
  units: UnitRecord[];
  selectedMaterialIds: number[];
  onToggleMaterial: (materialId: number) => void;
  resourceNodes: LessonPlanResourcePickerNode[];
  selectedResources: LessonPlanDayResourceRef[];
  courseHasResourceLinks: boolean;
  resourcesLoading: boolean;
  onToggleResource: (resource: LessonPlanDayResourceRef) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [pane, setPane] = useState<LessonPlanContentLinkPane>("materials");
  const [seenOpen, setSeenOpen] = useState(open);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) setPane("materials");
  }

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(40rem,90vh)] w-full max-w-lg flex-col rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <h2
          id={titleId}
          className="text-[20px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Link content
        </h2>
        <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
          Choose a material or a resource for {dayLabel}. Resources are only ones this course
          already links, including what’s inside a linked folder. Linking a resource here doesn’t
          share it.
        </p>
        <div className="mt-4">
          <TabList label="What to link">
            <Tab selected={pane === "materials"} onSelect={() => setPane("materials")}>
              Materials
            </Tab>
            <Tab selected={pane === "resources"} onSelect={() => setPane("resources")}>
              Resources
            </Tab>
          </TabList>
        </div>
        {pane === "materials" ? (
          <LessonPlanMaterialPicker
            materials={materials}
            units={units}
            selectedIds={selectedMaterialIds}
            onToggle={onToggleMaterial}
            autoFocus
          />
        ) : (
          <LessonPlanResourcePicker
            nodes={resourceNodes}
            selected={selectedResources}
            courseHasLinks={courseHasResourceLinks}
            loading={resourcesLoading}
            onToggle={onToggleResource}
            autoFocus
          />
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12.5px] text-[var(--ink-faint)]">
            {linkedContentSummary(selectedMaterialIds.length, selectedResources.length)}
          </p>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
