import { Button } from "@/ui/Button";

export function FamilyParentList({
  parents,
  removingId,
  onRemove,
}: {
  parents: Array<{ memberId: number; name: string; email: string }>;
  removingId: number | null;
  onRemove: (memberId: number) => void;
}) {
  if (parents.length === 0) {
    return (
      <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        No parents in this family yet. Link someone who already has a Course
        Wright account in this organization. Sending parent invites is a
        separate flow.
      </p>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
      {parents.map((parent) => (
        <li key={parent.memberId} className="flex items-center gap-3 px-4 py-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15.5px] font-extrabold text-[var(--ink)]">
              {parent.name}
            </span>
            {parent.email ? (
              <span className="mt-0.5 block truncate text-[12.5px] text-[var(--ink-faint)]">
                {parent.email}
              </span>
            ) : null}
          </span>
          <Button
            variant="secondary"
            onClick={() => onRemove(parent.memberId)}
            disabled={removingId === parent.memberId}
          >
            {removingId === parent.memberId ? "Removing…" : "Remove"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
