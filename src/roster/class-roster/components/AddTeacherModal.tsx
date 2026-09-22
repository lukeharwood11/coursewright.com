import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/ui/Avatar";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { staffMatchesQuery } from "@/roster/model/classGroup";

export function AddTeacherModal({
  open,
  staff,
  adding,
  error,
  onSelect,
  onClose,
}: {
  open: boolean;
  staff: Array<{ userId: string; name: string }>;
  adding: boolean;
  error: string | null;
  onSelect: (userId: string) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const matches = useMemo(
    () => staff.filter((person) => staffMatchesQuery(person, query)),
    [staff, query],
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

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
        className="relative flex max-h-[min(32rem,80vh)] w-full max-w-md flex-col rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <h2
          id={titleId}
          className="text-[20px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Add a teacher
        </h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
          Search staff and choose someone to lead this class.
        </p>
        <label className="mt-4 flex flex-col gap-1">
          <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">
            Search
          </span>
          <Input
            className="w-full"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by name…"
            aria-label="Filter staff"
            autoFocus
          />
        </label>
        {error ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]">{error}</p>
        ) : null}
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] p-1.5">
          {staff.length === 0 ? (
            <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
              No one left to add. Owners, admins, and instructors can be class
              teachers.
            </p>
          ) : matches.length === 0 ? (
            <p className="px-2 py-3 text-[13.5px] text-[var(--ink-soft)]">
              No staff match that search.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5" aria-label="Staff">
              {matches.map((person) => (
                <li key={person.userId}>
                  <button
                    type="button"
                    disabled={adding}
                    className={[
                      "flex w-full min-w-0 items-center gap-2 rounded-[8px] px-2 py-2 text-left",
                      "hover:bg-[var(--green-tint)]",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
                      "disabled:pointer-events-none disabled:opacity-60",
                    ].join(" ")}
                    onClick={() => onSelect(person.userId)}
                  >
                    <Avatar name={person.name} size={28} />
                    <span className="min-w-0 truncate text-[13.5px] font-semibold text-[var(--ink)]">
                      {person.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
