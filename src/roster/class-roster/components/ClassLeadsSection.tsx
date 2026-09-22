import { UserPlusIcon } from "@heroicons/react/24/outline";
import { UserCard } from "@/organizations/user-card/UserCard";
import { Button } from "@/ui/Button";
import { InfoHint } from "@/ui/InfoHint";
import type { ClassLeader } from "@/roster/databridge/classes";
import { AddTeacherModal } from "./AddTeacherModal";

export function ClassLeadsSection({
  orgSlug,
  leads,
  staff,
  canManage,
  addOpen,
  onOpenAdd,
  onCloseAdd,
  onAdd,
  onRemove,
  adding,
  addError,
}: {
  orgSlug: string;
  leads: ClassLeader[];
  staff: Array<{ userId: string; name: string }>;
  canManage: boolean;
  addOpen: boolean;
  onOpenAdd: () => void;
  onCloseAdd: () => void;
  onAdd: (userId: string) => void;
  onRemove: (userId: string) => void;
  adding: boolean;
  addError: string | null;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">
            Teachers
          </h2>
          <InfoHint label="What is a class lead?">
            Optional class leads. They’re notified in Activity when someone posts
            in a discussion for this class. A class can have more than one, or
            none.
          </InfoHint>
        </div>
        {canManage ? (
          <Button type="button" onClick={onOpenAdd}>
            <UserPlusIcon className="h-5 w-5" aria-hidden />
            Add teacher
          </Button>
        ) : null}
      </div>
      {leads.length === 0 ? (
        <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          No teachers assigned yet.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {leads.map((person) => (
            <li key={person.userId} className="max-w-full">
              <div className="inline-flex max-w-full items-center rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] py-1.5 pr-2 pl-1.5">
                <UserCard
                  orgSlug={orgSlug}
                  userId={person.userId}
                  name={person.name}
                  compact
                  fit
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
              </div>
            </li>
          ))}
        </ul>
      )}
      {canManage ? (
        <AddTeacherModal
          open={addOpen}
          staff={staff}
          adding={adding}
          error={addError}
          onSelect={onAdd}
          onClose={onCloseAdd}
        />
      ) : null}
    </section>
  );
}
