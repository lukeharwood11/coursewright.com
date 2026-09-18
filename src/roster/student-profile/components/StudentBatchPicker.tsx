import { useState } from "react";
import type { StudentSummary } from "@/roster/databridge/students";
import { studentMatchesQuery } from "@/roster/model/studentProfile";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";

const selectClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
  "disabled:bg-[var(--paper)] disabled:text-[var(--ink-soft)]",
].join(" ");

export type ClassPresetOption = {
  id: number;
  title: string;
};

export function StudentBatchPicker({
  students,
  selectedIds,
  saving,
  error,
  confirmLabel,
  emptyMessage,
  classPresets,
  selectedClassId,
  onSelectClass,
  onToggle,
  onSelectFiltered,
  onClear,
  onConfirm,
}: {
  students: StudentSummary[];
  selectedIds: number[];
  saving: boolean;
  error: string | null;
  confirmLabel: (count: number) => string;
  emptyMessage: string;
  classPresets?: ClassPresetOption[];
  selectedClassId?: string;
  onSelectClass?: (classId: string) => void;
  onToggle: (id: number) => void;
  onSelectFiltered: (ids: number[]) => void;
  onClear: () => void;
  onConfirm: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = students.filter((student) =>
    studentMatchesQuery(student, query),
  );
  const selectedSet = new Set(selectedIds);
  const filteredIds = filtered.map((student) => student.id);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedSet.has(id));

  if (students.length === 0) {
    return (
      <p className="text-[14px] leading-relaxed text-[var(--ink-soft)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div>
      {classPresets && classPresets.length > 0 && onSelectClass ? (
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Start from a class
          </span>
          <select
            className={selectClass}
            value={selectedClassId ?? ""}
            onChange={(event) => onSelectClass(event.target.value)}
            disabled={saving}
          >
            <option value="">Choose students below</option>
            {classPresets.map((preset) => (
              <option key={preset.id} value={String(preset.id)}>
                {preset.title}
              </option>
            ))}
          </select>
          <span className="text-[12.5px] text-[var(--ink-faint)]">
            Adds those students now. If the class changes later, this list
            won’t update on its own.
          </span>
        </label>
      ) : null}

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">
          Find students
        </span>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, grade, or parent email"
          disabled={saving}
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={saving || filteredIds.length === 0 || allFilteredSelected}
          onClick={() => onSelectFiltered(filteredIds)}
        >
          Select all{query.trim() ? " matching" : ""}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={saving || selectedIds.length === 0}
          onClick={onClear}
        >
          Clear
        </Button>
      </div>

      <ul className="mt-3 max-h-64 divide-y divide-[var(--line-soft)] overflow-y-auto rounded-[10px] border border-[var(--line-soft)]">
        {filtered.length === 0 ? (
          <li className="px-4 py-3 text-[13.5px] text-[var(--ink-soft)]">
            No students match that search.
          </li>
        ) : (
          filtered.map((student) => {
            const checked = selectedSet.has(student.id);
            return (
              <li key={student.id}>
                <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-[var(--green-tint)]">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[var(--green)]"
                    checked={checked}
                    disabled={saving}
                    onChange={() => onToggle(student.id)}
                  />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-extrabold text-[var(--ink)]">
                      {student.name}
                    </span>
                    <span className="block text-[12.5px] text-[var(--ink-soft)]">
                      {[student.gradeLevel, student.parentEmail]
                        .filter(Boolean)
                        .join(" · ") || "No grade or parent email"}
                    </span>
                  </span>
                </label>
              </li>
            );
          })
        )}
      </ul>

      {error ? (
        <p className="mt-2 text-[13px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        <Button
          type="button"
          disabled={saving || selectedIds.length === 0}
          onClick={onConfirm}
        >
          {saving ? "Saving…" : confirmLabel(selectedIds.length)}
        </Button>
      </div>
    </div>
  );
}
