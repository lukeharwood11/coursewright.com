import type { StudentSummary } from "@/roster/databridge/students";
import { Button } from "@/ui/Button";

const selectClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function ExistingStudentPicker({
  students,
  selectedId,
  saving,
  error,
  onSelect,
  onAdd,
}: {
  students: StudentSummary[];
  selectedId: string;
  saving: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  if (students.length === 0) return null;

  return (
    <div>
      <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">
        Add someone already in the org
      </h3>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <select
          className={`${selectClass} min-w-0 flex-1`}
          value={selectedId}
          onChange={(event) => onSelect(event.target.value)}
          disabled={saving}
        >
          <option value="">Choose a student</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.gradeLevel
                ? `${student.name} (${student.gradeLevel})`
                : student.name}
            </option>
          ))}
        </select>
        <Button onClick={onAdd} disabled={saving || !selectedId}>
          {saving ? "Adding…" : "Add"}
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-[13px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
