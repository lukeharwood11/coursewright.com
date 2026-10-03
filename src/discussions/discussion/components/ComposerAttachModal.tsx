import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BookOpenIcon, LinkIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { MaterialOutlinePickerModal } from "@/ui/MaterialOutlinePickerModal";
import type { AttachableMaterial } from "@/discussions/databridge/discussions";
import {
  filterAttachableLayout,
  layoutAttachableMaterials,
} from "@/discussions/model/attachablePicker";
import { isHttpUrl } from "@/discussions/model/validate";
import type {
  ResourcePickerFolder,
  ResourcePickerItem,
} from "@/discussions/model/resourcePicker";
import { SelectResourceModal } from "./SelectResourceModal";

type Step = "choose" | "material" | "resource" | "link";

function attachablePickerModel(
  layout: ReturnType<typeof filterAttachableLayout>,
  catalog: AttachableMaterial[],
) {
  if (layout.mode === "multiCourse") {
    return { kind: "courses" as const, courses: layout.courses };
  }
  const sample = catalog[0];
  return {
    kind: "courses" as const,
    courses: [
      {
        courseId: sample?.courseId ?? 0,
        courseTitle: sample?.courseTitle ?? "Course",
        groups: layout.groups,
      },
    ],
  };
}

export function ComposerAttachModal({
  open,
  materials,
  resourceItems,
  resourceFolders,
  onClose,
  onAddMaterial,
  onAddResource,
  onAddLink,
}: {
  open: boolean;
  materials: AttachableMaterial[];
  resourceItems: ResourcePickerItem[];
  resourceFolders: ResourcePickerFolder[];
  onClose: () => void;
  onAddMaterial: (material: AttachableMaterial) => void;
  onAddResource: (item: ResourcePickerItem) => void;
  onAddLink: (args: { url: string; label: string }) => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>("choose");
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(
    null,
  );
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(
    null,
  );
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  const baseLayout = useMemo(
    () => layoutAttachableMaterials(materials),
    [materials],
  );

  const getFilteredModel = useCallback(
    (query: string) =>
      attachablePickerModel(
        filterAttachableLayout(baseLayout, query),
        materials,
      ),
    [baseLayout, materials],
  );

  useEffect(() => {
    if (!open) return;
    setStep("choose");
    setSelectedMaterialId(null);
    setSelectedResourceId(null);
    setLinkUrl("");
    setLinkLabel("");
    setLinkError(null);
  }, [open]);

  useEffect(() => {
    if (!open || step !== "choose") return;
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      "button,input,select,textarea",
    );
    focusable?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, step]);

  function confirmMaterial() {
    if (selectedMaterialId == null) return;
    const material = materials.find((row) => row.id === selectedMaterialId);
    if (!material) return;
    onAddMaterial(material);
    onClose();
  }

  function confirmResource() {
    if (selectedResourceId == null) return;
    const item = resourceItems.find((row) => row.id === selectedResourceId);
    if (!item) return;
    onAddResource(item);
    onClose();
  }

  function confirmLink() {
    if (!isHttpUrl(linkUrl)) {
      setLinkError("Use a web address that starts with http:// or https://.");
      return;
    }
    onAddLink({ url: linkUrl.trim(), label: linkLabel.trim() });
    onClose();
  }

  if (!open) return null;

  if (step === "resource") {
    return (
      <SelectResourceModal
        open
        items={resourceItems}
        folders={resourceFolders}
        selectedId={selectedResourceId}
        onSelect={setSelectedResourceId}
        onClose={() => setStep("choose")}
        onConfirm={confirmResource}
      />
    );
  }

  if (step === "material") {
    return (
      <MaterialOutlinePickerModal
        open
        title="Add a material"
        description="Link a published page, file, or link from a course."
        searchPlaceholder="Filter by material, unit, or course…"
        catalogCount={materials.length}
        getFilteredModel={getFilteredModel}
        selectedIds={selectedMaterialId == null ? [] : [selectedMaterialId]}
        onToggle={(materialId) => setSelectedMaterialId(materialId)}
        selectionMode="single"
        emptyCatalogMessage="No materials you can attach here yet."
        onClose={() => setStep("choose")}
        primaryAction={{
          label: "Add material",
          disabled: selectedMaterialId == null,
          onClick: confirmMaterial,
        }}
      />
    );
  }

  const title = step === "choose" ? "Add to message" : "Add a link";

  let body: ReactNode;
  if (step === "choose") {
    body = (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="flex items-center gap-3 rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-3 text-left transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)]"
          onClick={() => setStep("material")}
        >
          <BookOpenIcon className="h-5 w-5 shrink-0 text-[var(--green)]" aria-hidden />
          <span>
            <span className="block text-[14px] font-extrabold text-[var(--ink)]">
              Material
            </span>
            <span className="mt-0.5 block text-[12.5px] text-[var(--ink-soft)]">
              Link a published page, file, or link from a course
            </span>
          </span>
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-3 text-left transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)]"
          onClick={() => setStep("resource")}
        >
          <RectangleStackIcon
            className="h-5 w-5 shrink-0 text-[var(--green)]"
            aria-hidden
          />
          <span>
            <span className="block text-[14px] font-extrabold text-[var(--ink)]">
              Resource
            </span>
            <span className="mt-0.5 block text-[12.5px] text-[var(--ink-soft)]">
              Link a document, file, or link from Resources
            </span>
          </span>
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-3 text-left transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)]"
          onClick={() => setStep("link")}
        >
          <LinkIcon className="h-5 w-5 shrink-0 text-[var(--green)]" aria-hidden />
          <span>
            <span className="block text-[14px] font-extrabold text-[var(--ink)]">
              Link
            </span>
            <span className="mt-0.5 block text-[12.5px] text-[var(--ink-soft)]">
              Add a web address
            </span>
          </span>
        </button>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-3">
        <label className="block">
          <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">
            Address
          </span>
          <Input
            className="mt-1 w-full"
            value={linkUrl}
            onChange={(event) => {
              setLinkUrl(event.target.value);
              setLinkError(null);
            }}
            placeholder="https://"
            aria-label="Link address"
          />
        </label>
        <label className="block">
          <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">
            Label (optional)
          </span>
          <Input
            className="mt-1 w-full"
            value={linkLabel}
            onChange={(event) => setLinkLabel(event.target.value)}
            placeholder="What should people see?"
            aria-label="Link label"
          />
        </label>
        {linkError ? (
          <p className="text-[13px] text-[var(--amber-deep)]" role="alert">
            {linkError}
          </p>
        ) : null}
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-sm rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <h2
          id={titleId}
          className="text-[15.5px] font-extrabold text-[var(--ink)]"
        >
          {title}
        </h2>
        <div className="mt-3">{body}</div>
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          {step === "link" ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep("choose")}
            >
              Back
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {step === "link" ? (
            <Button type="button" onClick={confirmLink}>
              Add link
            </Button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
