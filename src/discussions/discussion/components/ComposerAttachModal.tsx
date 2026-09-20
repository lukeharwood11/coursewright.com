import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BookOpenIcon, LinkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import type { AttachableMaterial } from "@/discussions/databridge/discussions";
import { isHttpUrl } from "@/discussions/model/validate";

type Step = "choose" | "material" | "link";

export function ComposerAttachModal({
  open,
  materials,
  onClose,
  onAddMaterial,
  onAddLink,
}: {
  open: boolean;
  materials: AttachableMaterial[];
  onClose: () => void;
  onAddMaterial: (material: AttachableMaterial) => void;
  onAddLink: (args: { url: string; label: string }) => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>("choose");
  const [materialId, setMaterialId] = useState<number | "">("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("choose");
    setMaterialId("");
    setLinkUrl("");
    setLinkLabel("");
    setLinkError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
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

  if (!open) return null;

  const title =
    step === "choose"
      ? "Add to message"
      : step === "material"
        ? "Add a material"
        : "Add a link";

  function confirmMaterial() {
    if (materialId === "") return;
    const material = materials.find((row) => row.id === materialId);
    if (!material) return;
    onAddMaterial(material);
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
  } else if (step === "material") {
    body = (
      <label className="block">
        <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">
          Material
        </span>
        <Select
          wrapperClassName="mt-1 w-full"
          value={materialId === "" ? "" : String(materialId)}
          onChange={(event) =>
            setMaterialId(event.target.value ? Number(event.target.value) : "")
          }
        >
          <option value="">Choose a material</option>
          {materials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.courseTitle}: {material.title}
            </option>
          ))}
        </Select>
        {materials.length === 0 ? (
          <p className="mt-2 text-[13px] text-[var(--ink-soft)]">
            No materials you can attach here yet.
          </p>
        ) : null}
      </label>
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
          {step !== "choose" ? (
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
          {step === "material" ? (
            <Button
              type="button"
              disabled={materialId === ""}
              onClick={confirmMaterial}
            >
              Add material
            </Button>
          ) : null}
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
