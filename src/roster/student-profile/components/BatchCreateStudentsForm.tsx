import type { FormEvent } from "react";
import type { NewStudentDraft } from "@/roster/model/studentProfile";
import { Button } from "@/ui/Button";
import { StudentProfileFields } from "@/roster/student-profile/components/StudentProfileFields";

const textareaClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
  "disabled:bg-[var(--paper)] disabled:text-[var(--ink-soft)]",
].join(" ");

export function BatchCreateStudentsForm({
  drafts,
  pasteText,
  gradeLabels,
  error,
  saving,
  submitLabel,
  onDraftChange,
  onAddRow,
  onRemoveRow,
  onPasteTextChange,
  onApplyPaste,
  onSubmit,
}: {
  drafts: NewStudentDraft[];
  pasteText: string;
  gradeLabels: string[];
  error: string | null;
  saving: boolean;
  submitLabel: (count: number) => string;
  onDraftChange: (index: number, draft: NewStudentDraft) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onPasteTextChange: (value: string) => void;
  onApplyPaste: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const filledCount = drafts.filter((draft) => draft.name.trim()).length;
  const invitingCount = drafts.filter(
    (draft) => draft.name.trim() && draft.studentEmail.trim(),
  ).length;
  const buttonLabel = addStudentsButtonLabel(
    submitLabel(filledCount),
    filledCount,
    invitingCount,
  );

  return (
    <form onSubmit={onSubmit}>
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">
          Paste names (optional)
        </span>
        <textarea
          className={textareaClass}
          rows={3}
          value={pasteText}
          onChange={(event) => onPasteTextChange(event.target.value)}
          disabled={saving}
          placeholder={"One name per line\nMaya Chen\nJordan Lee"}
        />
      </label>
      <div className="mt-2">
        <Button
          type="button"
          variant="secondary"
          disabled={saving || !pasteText.trim()}
          onClick={onApplyPaste}
        >
          Add pasted names
        </Button>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {drafts.map((draft, index) => (
          <div
            key={index}
            className="rounded-[10px] border border-[var(--line-soft)] p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 className="text-[13px] font-bold text-[var(--ink-soft)]">
                Student {index + 1}
              </h4>
              {drafts.length > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => onRemoveRow(index)}
                >
                  Remove row
                </Button>
              ) : null}
            </div>
            <StudentProfileFields
              name={draft.name}
              parentEmail={draft.parentEmail}
              studentEmail={draft.studentEmail}
              gradeLevel={draft.gradeLevel}
              gradeLabels={gradeLabels}
              disabled={saving}
              onNameChange={(name) => onDraftChange(index, { ...draft, name })}
              onParentEmailChange={(parentEmail) =>
                onDraftChange(index, { ...draft, parentEmail })
              }
              onStudentEmailChange={(studentEmail) =>
                onDraftChange(index, { ...draft, studentEmail })
              }
              onGradeLevelChange={(gradeLevel) =>
                onDraftChange(index, { ...draft, gradeLevel })
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Button type="button" variant="secondary" disabled={saving} onClick={onAddRow}>
          Add another student
        </Button>
      </div>

      {error ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        <Button type="submit" disabled={saving || filledCount === 0}>
          {saving ? "Saving…" : buttonLabel}
        </Button>
      </div>
    </form>
  );
}

function addStudentsButtonLabel(
  base: string,
  added: number,
  inviting: number,
): string {
  if (inviting === 0) return base;
  if (inviting === added) {
    return added === 1 ? `${base} and send invite` : `${base} and send invites`;
  }
  return inviting === 1
    ? `${base} and send 1 invite`
    : `${base} and send ${inviting} invites`;
}
