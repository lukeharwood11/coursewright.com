export function FamilyParentList({
  parents,
  pendingInvites,
  studentNames,
}: {
  parents: Array<{
    userId: string;
    name: string;
    email: string;
    studentIds: number[];
  }>;
  pendingInvites: Array<{ id: number; email: string; studentProfileId: number }>;
  studentNames: Map<number, string>;
}) {
  if (parents.length === 0 && pendingInvites.length === 0) {
    return (
      <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        No parent–student links yet. Link an account, or save an invite for an
        email that doesn’t have a Course Wright account. A parent linked to
        students in two families shows up in both.
      </p>
    );
  }

  return (
    <div className="mt-4">
      {parents.length > 0 ? (
        <ul className="divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
          {parents.map((parent) => (
            <li key={parent.userId} className="px-4 py-3">
              <span className="block truncate text-[15.5px] font-extrabold text-[var(--ink)]">
                {parent.name}
              </span>
              {parent.email ? (
                <span className="mt-0.5 block truncate text-[12.5px] text-[var(--ink-faint)]">
                  {parent.email}
                </span>
              ) : null}
              <span className="mt-0.5 block truncate text-[12.5px] text-[var(--ink-faint)]">
                Linked to{" "}
                {parent.studentIds
                  .map((id) => studentNames.get(id) ?? "a student")
                  .join(", ")}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {pendingInvites.length > 0 ? (
        <div className={parents.length > 0 ? "mt-4" : undefined}>
          <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">
            Pending invites
          </h3>
          <ul className="mt-2 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="px-4 py-3">
                <span className="block truncate text-[15.5px] font-extrabold text-[var(--ink)]">
                  {invite.email}
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-[var(--ink-faint)]">
                  Invite saved for{" "}
                  {studentNames.get(invite.studentProfileId) ?? "a student"}.
                  Sending and claim are still a separate flow.
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
