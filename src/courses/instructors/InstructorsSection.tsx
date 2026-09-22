import { UserCard } from "@/organizations/user-card/UserCard";
import { Button } from "@/ui/Button";
import type { CourseInstructor } from "@/courses/databridge/courses";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function InstructorsSection({
  orgSlug,
  instructors,
  staff,
  canManage,
  addUserId,
  onAddUserId,
  onAdd,
  onRemove,
  adding,
  addError,
}: {
  orgSlug: string;
  instructors: CourseInstructor[];
  staff: Array<{ userId: string; name: string }>;
  canManage: boolean;
  addUserId: string;
  onAddUserId: (value: string) => void;
  onAdd: () => void;
  onRemove: (userId: string) => void;
  adding: boolean;
  addError: string | null;
}) {
  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Teachers</h2>
      <p className="mt-1 max-w-xl text-[13.5px] text-[var(--ink-soft)]">
        People who teach this course. A course can have more than one teacher.
      </p>
      {instructors.length === 0 ? (
        <p className="mt-3 text-[13.5px] text-[var(--ink-faint)]">
          No teachers listed yet.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1">
          {instructors.map((person) => (
            <li key={person.userId}>
              <UserCard
                orgSlug={orgSlug}
                userId={person.userId}
                name={person.name}
                compact
                trailing={
                  canManage ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-2.5 py-1.5 text-[12px]"
                      onClick={() => onRemove(person.userId)}
                    >
                      Remove
                    </Button>
                  ) : null
                }
              />
            </li>
          ))}
        </ul>
      )}
      {canManage ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <select
            className={`${controlClass} min-w-0 flex-1`}
            value={addUserId}
            onChange={(event) => onAddUserId(event.target.value)}
          >
            <option value="">Add a teacher</option>
            {staff.map((person) => (
              <option key={person.userId} value={person.userId}>
                {person.name}
              </option>
            ))}
          </select>
          <Button type="button" disabled={!addUserId || adding} onClick={onAdd}>
            {adding ? "Adding…" : "Add"}
          </Button>
        </div>
      ) : null}
      {addError ? (
        <p className="mt-2 text-[13px] text-[var(--amber-deep)]">{addError}</p>
      ) : null}
    </section>
  );
}
