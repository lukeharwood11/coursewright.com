import { useId, useRef, useState } from "react";
import {
  LinkIcon,
  PaperClipIcon,
  BookOpenIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import type { AttachableMaterial } from "@/discussions/databridge/discussions";
import { isHttpUrl } from "@/discussions/model/validate";

export type PendingAttachment =
  | { key: string; kind: "file"; file: File; label: string }
  | { key: string; kind: "material"; materialId: number; label: string }
  | { key: string; kind: "url"; url: string; label: string };

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "placeholder:text-[var(--ink-faint)]",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

function newKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `att-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function MessageComposer({
  body,
  onBody,
  attachments,
  onAttachments,
  materials,
  canSubmit,
  submitting,
  submitLabel,
  placeholder,
  error,
  onSubmit,
  showSubmit = true,
}: {
  body: string;
  onBody: (value: string) => void;
  attachments: PendingAttachment[];
  onAttachments: (next: PendingAttachment[]) => void;
  materials: AttachableMaterial[];
  canSubmit: boolean;
  submitting: boolean;
  submitLabel: string;
  placeholder: string;
  error: string | null;
  onSubmit: () => void;
  showSubmit?: boolean;
}) {
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [materialId, setMaterialId] = useState<number | "">("");

  function addFile(file: File) {
    onAttachments([
      ...attachments,
      { key: newKey(), kind: "file", file, label: file.name },
    ]);
  }

  function addLink() {
    if (!isHttpUrl(linkUrl)) {
      setLinkError("Use a web address that starts with http:// or https://.");
      return;
    }
    onAttachments([
      ...attachments,
      {
        key: newKey(),
        kind: "url",
        url: linkUrl.trim(),
        label: linkLabel.trim(),
      },
    ]);
    setLinkUrl("");
    setLinkLabel("");
    setLinkError(null);
    setLinkOpen(false);
  }

  function addMaterial() {
    if (materialId === "") return;
    const material = materials.find((row) => row.id === materialId);
    if (!material) return;
    onAttachments([
      ...attachments,
      {
        key: newKey(),
        kind: "material",
        materialId: material.id,
        label: material.title,
      },
    ]);
    setMaterialId("");
    setMaterialOpen(false);
  }

  return (
    <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4">
      <label className="flex flex-col gap-1">
        <span className="sr-only">Message</span>
        <textarea
          className={`${controlClass} min-h-[5.5rem] resize-y`}
          value={body}
          onChange={(event) => onBody(event.target.value)}
          placeholder={placeholder}
        />
      </label>

      {attachments.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {attachments.map((attachment) => (
            <li
              key={attachment.key}
              className="flex items-center justify-between gap-2 rounded-[6px] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-2"
            >
              <span className="min-w-0 truncate text-[13px] font-semibold text-[var(--ink)]">
                {attachment.kind === "file"
                  ? attachment.label
                  : attachment.kind === "material"
                    ? `Material: ${attachment.label}`
                    : attachment.label || attachment.url}
              </span>
              <button
                type="button"
                className="shrink-0 rounded-[4px] p-1 text-[var(--ink-soft)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
                aria-label="Remove attachment"
                onClick={() =>
                  onAttachments(
                    attachments.filter((item) => item.key !== attachment.key),
                  )
                }
              >
                <XMarkIcon className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {linkOpen ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
          <Input
            className="w-full"
            value={linkUrl}
            onChange={(event) => {
              setLinkUrl(event.target.value);
              setLinkError(null);
            }}
            placeholder="https://"
            aria-label="Link address"
          />
          <Input
            className="w-full"
            value={linkLabel}
            onChange={(event) => setLinkLabel(event.target.value)}
            placeholder="Label (optional)"
            aria-label="Link label"
          />
          <Button type="button" variant="secondary" onClick={addLink}>
            Add link
          </Button>
          {linkError ? (
            <p className="sm:col-span-3 text-[13px] text-[var(--amber-deep)]" role="alert">
              {linkError}
            </p>
          ) : null}
        </div>
      ) : null}

      {materialOpen ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="min-w-[12rem] flex-1">
            <span className="sr-only">Material</span>
            <Select
              wrapperClassName="w-full"
              value={materialId === "" ? "" : String(materialId)}
              onChange={(event) =>
                setMaterialId(
                  event.target.value ? Number(event.target.value) : "",
                )
              }
            >
              <option value="">Choose a material</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.courseTitle}: {material.title}
                </option>
              ))}
            </Select>
          </label>
          <Button
            type="button"
            variant="secondary"
            onClick={addMaterial}
            disabled={materialId === ""}
          >
            Add material
          </Button>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          id={fileInputId}
          ref={fileRef}
          type="file"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) addFile(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileRef.current?.click()}
        >
          <PaperClipIcon className="h-4 w-4" aria-hidden />
          Add file
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setMaterialOpen((open) => !open)}
        >
          <BookOpenIcon className="h-4 w-4" aria-hidden />
          Add material
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setLinkOpen((open) => !open)}
        >
          <LinkIcon className="h-4 w-4" aria-hidden />
          Add link
        </Button>
        {showSubmit ? (
          <Button
            className="ml-auto"
            type="button"
            disabled={!canSubmit || submitting}
            onClick={onSubmit}
          >
            {submitting ? "Posting…" : submitLabel}
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
