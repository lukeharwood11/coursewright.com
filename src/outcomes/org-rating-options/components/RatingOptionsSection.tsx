import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { OrgSettingsSectionTitle } from "@/organizations/org-settings/components/OrgSettingsSectionTitle";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Input } from "@/ui/Input";
import { useToastOnError } from "@/ui/useToastOnError";
import { useRatingOptions } from "../hooks/useRatingOptions";

export function RatingOptionsSection() {
  const rating = useRatingOptions();
  const [draft, setDraft] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: number; label: string } | null>(
    null,
  );
  useToastOnError(rating.error);

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <OrgSettingsSectionTitle tab="outcomes" />
      <p className="mt-2 max-w-xl text-[14px] text-[var(--ink-soft)]">
        These are the words teachers pick when they rate a course outcome. They
        are separate from letter grades.
      </p>
      {!rating.canEdit ? (
        <p className="mt-2 text-[14px] text-[var(--ink-soft)]">
          Only owners and admins can change rating options.
        </p>
      ) : null}

      {rating.loading ? (
        <p className="mt-4 text-[14px] text-[var(--ink-soft)]">Loading outcomes…</p>
      ) : (
        <>
          {rating.options.length === 0 ? (
            <p className="mt-4 text-[14px] text-[var(--ink-soft)]">
              Add the words teachers will choose, such as Mastered or In progress.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {rating.options.map((option, index) => (
                <li
                  key={option.id}
                  className="flex flex-wrap items-center gap-2 rounded-[8px] border border-[var(--line-soft)] px-3 py-2"
                >
                  <Input
                    className="min-w-[12rem] flex-1"
                    defaultValue={option.label}
                    key={`${option.id}-${option.label}`}
                    disabled={!rating.canEdit}
                    aria-label={`Rating label ${index + 1}`}
                    onBlur={(event) => {
                      const next = event.target.value;
                      if (next.trim() && next.trim() !== option.label) {
                        rating.saveLabel(option.id, next);
                      }
                    }}
                  />
                  <label className="flex items-center gap-2 text-[13px] font-bold text-[var(--ink-soft)]">
                    <input
                      type="checkbox"
                      className="accent-[var(--green)]"
                      checked={option.isActive}
                      disabled={!rating.canEdit}
                      onChange={(event) => rating.setActive(option.id, event.target.checked)}
                    />
                    Active
                  </label>
                  {rating.canEdit ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="secondary"
                        aria-label={`Move ${option.label} up`}
                        disabled={index === 0}
                        onClick={() => rating.moveUp(option)}
                      >
                        <ChevronUpIcon className="h-4 w-4" aria-hidden />
                      </Button>
                      <Button
                        variant="secondary"
                        aria-label={`Move ${option.label} down`}
                        disabled={index === rating.options.length - 1}
                        onClick={() => rating.moveDown(option)}
                      >
                        <ChevronDownIcon className="h-4 w-4" aria-hidden />
                      </Button>
                      <Button
                        variant="secondary"
                        aria-label={`Remove ${option.label}`}
                        onClick={() => setPendingDelete({ id: option.id, label: option.label })}
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  ) : null}
                  {!option.isActive ? (
                    <span className="text-[12px] text-[var(--ink-faint)]">
                      Hidden from new ratings
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {rating.canEdit ? (
            <form
              className="mt-4 flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                rating.addOption(draft, () => setDraft(""));
              }}
            >
              <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
                <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                  New rating
                </span>
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Mastered"
                />
              </label>
              <Button type="submit" disabled={rating.saving || !draft.trim()}>
                <PlusIcon className="h-4 w-4" aria-hidden />
                Add rating
              </Button>
            </form>
          ) : null}
          {rating.formError ? (
            <p className="mt-2 text-[13px] font-bold text-[var(--amber-deep)]" role="alert">
              {rating.formError}
            </p>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={pendingDelete != null}
        title="Remove this rating?"
        body={
          pendingDelete
            ? `Teachers will no longer see “${pendingDelete.label}”. Hide it instead if older ratings should keep the word.`
            : ""
        }
        confirmLabel="Remove rating"
        cancelLabel="Cancel"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) rating.removeOption(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </section>
  );
}
