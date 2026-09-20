import { Avatar } from "@/ui/Avatar";
import { parseOrgRole, roleLabel } from "@/organizations/model/role";
import type { MentionPerson } from "@/discussions/model/mentions";

export function MentionPicker({
  people,
  selectedIndex,
  loading,
  onHover,
  onSelect,
}: {
  people: MentionPerson[];
  selectedIndex: number;
  loading?: boolean;
  onHover: (index: number) => void;
  onSelect: (person: MentionPerson) => void;
}) {
  return (
    <div className="cw-slash-menu" role="listbox" aria-label="Mention someone">
      {loading ? (
        <p className="cw-mention-empty">Loading…</p>
      ) : null}
      {!loading && people.length === 0 ? (
        <p className="cw-mention-empty">No one matches.</p>
      ) : null}
      {!loading
        ? people.map((person, index) => {
            const role = person.role ? parseOrgRole(person.role) : null;
            return (
              <button
                key={person.userId}
                type="button"
                role="option"
                aria-selected={selectedIndex === index}
                className={[
                  "cw-slash-item",
                  selectedIndex === index ? "is-active" : "",
                ].join(" ")}
                onMouseEnter={() => onHover(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelect(person);
                }}
              >
                <Avatar name={person.name} size={28} />
                <span className="min-w-0 flex-1 truncate">{person.name}</span>
                {role ? (
                  <span className="shrink-0 text-[12px] font-bold text-[var(--ink-faint)]">
                    {roleLabel(role)}
                  </span>
                ) : null}
              </button>
            );
          })
        : null}
    </div>
  );
}
