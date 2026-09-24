import { useState } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import {
  LinkMaterialsModal,
  type EventMaterialOption,
} from "./LinkMaterialsModal";

export function EventMaterialsField({
  options,
  selectedIds,
  needsCourse,
  disabled,
  onToggle,
}: {
  options: EventMaterialOption[];
  selectedIds: number[];
  needsCourse: boolean;
  disabled: boolean;
  onToggle: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const byId = new Map(options.map((option) => [option.id, option]));
  const linked = selectedIds
    .map((id) => byId.get(id))
    .filter((option): option is EventMaterialOption => option != null);
  const canLink = !needsCourse && !disabled;

  return (
    <div className="mt-6">
      <p className="text-[13px] font-bold text-[var(--ink-soft)]">Materials</p>
      {needsCourse ? (
        <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
          Choose a course first to link material
        </p>
      ) : linked.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1.5">
          {linked.map((material) => (
            <li
              key={material.id}
              className="flex items-start justify-between gap-2 rounded-[6px] border border-[var(--line-soft)] bg-[var(--paper)] px-2.5 py-1.5"
            >
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-[var(--ink)]">
                  {material.title}
                </span>
                <span className="block text-[12px] text-[var(--ink-faint)]">
                  {material.courseTitle}
                </span>
              </span>
              <button
                type="button"
                className="shrink-0 rounded-[4px] p-0.5 text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] disabled:pointer-events-none disabled:opacity-60"
                aria-label={`Remove ${material.title}`}
                disabled={disabled}
                onClick={() => onToggle(material.id)}
              >
                <XMarkIcon className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
          No materials linked yet.
        </p>
      )}
      {!needsCourse ? (
        <Button
          type="button"
          variant="ghost"
          fullWidth
          className="mt-2"
          disabled={!canLink}
          onClick={() => setOpen(true)}
        >
          <PlusIcon className="h-4 w-4" aria-hidden />
          Link materials
        </Button>
      ) : null}
      <LinkMaterialsModal
        open={open}
        options={options}
        selectedIds={selectedIds}
        onToggle={onToggle}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
