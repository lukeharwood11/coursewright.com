import type { FormEvent, ReactNode } from "react";
import type { StudentSummary } from "@/roster/databridge/students";
import type { NewStudentDraft } from "@/roster/model/studentProfile";
import { BatchCreateStudentsForm } from "@/roster/student-profile/components/BatchCreateStudentsForm";
import {
  StudentBatchPicker,
  type ClassPresetOption,
} from "@/roster/student-profile/components/StudentBatchPicker";
import { Button } from "@/ui/Button";

type PanelTab = "existing" | "new";

export function AddStudentsPanel({
  open,
  onClose,
  title,
  disclaimer,
  tab,
  onTabChange,
  students,
  selectedIds,
  existingError,
  existingSaving,
  existingConfirmLabel,
  existingEmptyMessage,
  classPresets,
  selectedClassId,
  onSelectClass,
  onToggle,
  onSelectFiltered,
  onClear,
  onConfirmExisting,
  drafts,
  pasteText,
  gradeLabels,
  newError,
  newSaving,
  newSubmitLabel,
  onDraftChange,
  onAddRow,
  onRemoveRow,
  onPasteTextChange,
  onApplyPaste,
  onSubmitNew,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  disclaimer?: ReactNode;
  tab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  students: StudentSummary[];
  selectedIds: number[];
  existingError: string | null;
  existingSaving: boolean;
  existingConfirmLabel: (count: number) => string;
  existingEmptyMessage: string;
  classPresets?: ClassPresetOption[];
  selectedClassId?: string;
  onSelectClass?: (classId: string) => void;
  onToggle: (id: number) => void;
  onSelectFiltered: (ids: number[]) => void;
  onClear: () => void;
  onConfirmExisting: () => void;
  drafts: NewStudentDraft[];
  pasteText: string;
  gradeLabels: string[];
  newError: string | null;
  newSaving: boolean;
  newSubmitLabel: (count: number) => string;
  onDraftChange: (index: number, draft: NewStudentDraft) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onPasteTextChange: (value: string) => void;
  onApplyPaste: () => void;
  onSubmitNew: (event: FormEvent) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <section className="mt-6 max-w-3xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">
            {title}
          </h2>
          {disclaimer ? (
            <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
              {disclaimer}
            </p>
          ) : null}
        </div>
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={tab === "existing" ? "primary" : "secondary"}
          onClick={() => onTabChange("existing")}
        >
          From roster
        </Button>
        <Button
          type="button"
          variant={tab === "new" ? "primary" : "secondary"}
          onClick={() => onTabChange("new")}
        >
          New students
        </Button>
      </div>

      <div className="mt-5">
        {tab === "existing" ? (
          <StudentBatchPicker
            students={students}
            selectedIds={selectedIds}
            saving={existingSaving}
            error={existingError}
            confirmLabel={existingConfirmLabel}
            emptyMessage={existingEmptyMessage}
            classPresets={classPresets}
            selectedClassId={selectedClassId}
            onSelectClass={onSelectClass}
            onToggle={onToggle}
            onSelectFiltered={onSelectFiltered}
            onClear={onClear}
            onConfirm={onConfirmExisting}
          />
        ) : (
          <BatchCreateStudentsForm
            drafts={drafts}
            pasteText={pasteText}
            gradeLabels={gradeLabels}
            error={newError}
            saving={newSaving}
            submitLabel={newSubmitLabel}
            onDraftChange={onDraftChange}
            onAddRow={onAddRow}
            onRemoveRow={onRemoveRow}
            onPasteTextChange={onPasteTextChange}
            onApplyPaste={onApplyPaste}
            onSubmit={onSubmitNew}
          />
        )}
      </div>
    </section>
  );
}
