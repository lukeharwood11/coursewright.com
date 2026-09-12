import type { OrgRole } from "@/organizations/model/role";
import { roleLabel } from "@/organizations/model/role";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";

const selectClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function LinkParentPicker({
  students,
  people,
  linkStudentId,
  selectedParentId,
  email,
  saving,
  error,
  onStudentSelect,
  onParentSelect,
  onEmailChange,
  onAdd,
}: {
  students: Array<{ id: number; name: string }>;
  people: Array<{ userId: string; name: string; email: string; role: OrgRole }>;
  linkStudentId: string;
  selectedParentId: string;
  email: string;
  saving: boolean;
  error: string | null;
  onStudentSelect: (id: string) => void;
  onParentSelect: (id: string) => void;
  onEmailChange: (value: string) => void;
  onAdd: () => void;
}) {
  if (students.length === 0) {
    return (
      <div>
        <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">
          Link a parent
        </h3>
        <p className="mt-1 text-[14px] leading-relaxed text-[var(--ink-soft)]">
          Add a student first. Parents show up here from parent–student links —
          not from family membership.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">
        Link a parent
      </h3>
      <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
        Creates or reuses a parent–student link. That is what parent access
        uses. This does not enroll anyone in a course, and it does not write
        family membership for the parent.
      </p>

      {students.length > 1 ? (
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Student
          </span>
          <select
            className={selectClass}
            value={linkStudentId}
            onChange={(event) => onStudentSelect(event.target.value)}
            disabled={saving}
          >
            <option value="all">Every student in this family</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {people.length > 0 ? (
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Account in this organization
          </span>
          <select
            className={selectClass}
            value={selectedParentId}
            onChange={(event) => onParentSelect(event.target.value)}
            disabled={saving}
          >
            <option value="">Choose someone, or use email below</option>
            {people.map((person) => (
              <option key={person.userId} value={person.userId}>
                {person.name} ({person.email}) — {roleLabel(person.role)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
          No other Course Wright accounts in this organization yet. Enter an
          email to save a claim invite.
        </p>
      )}

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">
          Or email (if they don’t have an account)
        </span>
        <Input
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="parent@example.com"
          disabled={saving}
        />
      </label>

      <div className="mt-3">
        <Button onClick={onAdd} disabled={saving}>
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
