import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { PickerPaginationBar, pickerModalListScrollClass, pickerModalListShellClass, pickerModalPagerSlotClass, slicePickerPage } from "@/ui/PickerPagination";
import type { StudentSummary } from "@/roster/databridge/students";

function filterStudents(students: StudentSummary[], query: string): StudentSummary[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return students;
  return students.filter((student) => student.name.toLowerCase().includes(needle));
}

export function SelectStudentsModal({
  open,
  students,
  selectedIds,
  onToggle,
  onClose,
}: {
  open: boolean;
  students: StudentSummary[];
  selectedIds: number[];
  onToggle: (studentId: number) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const filtered = useMemo(
    () => filterStudents(students, query),
    [students, query],
  );
  const paged = useMemo(() => slicePickerPage(filtered, page), [filtered, page]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setPage(1);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > paged.pageCount) setPage(paged.pageCount);
  }, [page, paged.pageCount]);

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
          Choose students
        </h2>
        <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
          Pick who should see this announcement on home.
        </p>
        <label className="mt-4 flex flex-col gap-1">
          <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">Search</span>
          <Input
            className="w-full"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by name…"
            aria-label="Filter students"
            autoFocus
          />
        </label>
        <div className={`mt-3 ${pickerModalListShellClass}`}>
          <div className={pickerModalListScrollClass}>
            {students.length === 0 ? (
              <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
                Add students to your roster first.
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
                No students match that search.
              </p>
            ) : (
              <ul className="flex flex-col gap-0.5" aria-label="Students">
                {paged.items.map((student) => (
                  <li key={student.id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-[4px] px-1.5 py-1.5 hover:bg-[var(--green-tint)]">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--green)]"
                        checked={selected.has(student.id)}
                        onChange={() => onToggle(student.id)}
                      />
                      <span className="min-w-0 text-[13.5px] font-semibold text-[var(--ink)]">
                        {student.name}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={pickerModalPagerSlotClass}>
            {paged.needsPagination ? (
              <PickerPaginationBar
                page={paged.page}
                pageCount={paged.pageCount}
                total={paged.total}
                onPage={setPage}
              />
            ) : null}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12.5px] text-[var(--ink-faint)]">
            {selectedIds.length === 0
              ? "None selected"
              : `${selectedIds.length} selected`}
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
