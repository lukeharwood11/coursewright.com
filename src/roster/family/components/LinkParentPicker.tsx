import type { OrgRole } from "@/organizations/model/role";
import { roleLabel } from "@/organizations/model/role";
import { Button } from "@/ui/Button";

const selectClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function LinkParentPicker({
  people,
  selectedId,
  saving,
  error,
  onSelect,
  onAdd,
}: {
  people: Array<{ userId: string; name: string; email: string; role: OrgRole }>;
  selectedId: string;
  saving: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  if (people.length === 0) return null;

  return (
    <div>
      <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">
        Link a parent account
      </h3>
      <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
        This groups them in the directory and creates or reuses a parent–student
        link for students in this household. It does not enroll anyone in a
        course.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select
          className={`${selectClass} min-w-0 flex-1`}
          value={selectedId}
          onChange={(event) => onSelect(event.target.value)}
          disabled={saving}
        >
          <option value="">Choose someone in this organization</option>
          {people.map((person) => (
            <option key={person.userId} value={person.userId}>
              {person.name} ({person.email}) — {roleLabel(person.role)}
            </option>
          ))}
        </select>
        <Button onClick={onAdd} disabled={saving || !selectedId}>
          {saving ? "Linking…" : "Link parent"}
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
