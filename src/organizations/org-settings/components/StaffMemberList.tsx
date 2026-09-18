import { useState } from "react";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import type { StaffMemberRow } from "../hooks/useOrgStaff";

const controlClass = [
  "rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[13px] font-bold text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
  "disabled:bg-[var(--paper)] disabled:text-[var(--ink-soft)]",
].join(" ");

export function StaffMemberList({
  members,
  changingId,
  removingId,
  onChangeRole,
  onRemove,
}: {
  members: StaffMemberRow[];
  changingId: number | null;
  removingId: number | null;
  onChangeRole: (member: StaffMemberRow, nextRole: string) => void;
  onRemove: (member: StaffMemberRow) => void;
}) {
  const [pendingRemove, setPendingRemove] = useState<StaffMemberRow | null>(null);

  if (members.length === 0) {
    return (
      <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
        No owners, admins, or instructors yet.
      </p>
    );
  }

  const pendingName = pendingRemove
    ? pendingRemove.name || pendingRemove.email
    : "";

  return (
    <>
      <ul className="mt-3 divide-y divide-[var(--line-soft)]">
        {members.map((member) => {
          const displayName = member.name || member.email;
          const busy =
            changingId === member.membershipId || removingId === member.membershipId;

          return (
            <li key={member.membershipId} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-extrabold text-[var(--ink)]">
                  {displayName}
                  {member.isYou ? (
                    <span className="ml-2 text-[12.5px] font-bold text-[var(--ink-faint)]">
                      You
                    </span>
                  ) : null}
                </p>
                {member.name ? (
                  <p className="truncate text-[12.5px] text-[var(--ink-faint)]">{member.email}</p>
                ) : null}
                {member.guardMessage ? (
                  <p className="mt-1 text-[12.5px] text-[var(--ink-soft)]">
                    {member.guardMessage}
                  </p>
                ) : null}
              </div>

              {member.canChangeRole ? (
                <label>
                  <span className="sr-only">Role for {displayName}</span>
                  <select
                    className={controlClass}
                    value={member.role}
                    disabled={busy}
                    onChange={(event) => onChangeRole(member, event.target.value)}
                  >
                    {member.changeRoles.map((option) => (
                      <option key={option} value={option}>
                        {roleLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <Badge variant={roleBadgeVariant(member.role)}>{roleLabel(member.role)}</Badge>
              )}

              {member.canRemove ? (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setPendingRemove(member)}
                >
                  {removingId === member.membershipId ? "Removing…" : "Remove"}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title="Remove from staff?"
        body={
          pendingRemove?.isYou
            ? "You’ll no longer be staff in this organization until someone invites you again."
            : `${pendingName} will no longer be staff in this organization until you invite them again.`
        }
        confirmLabel="Remove"
        cancelLabel="Keep them"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (!pendingRemove) return;
          const member = pendingRemove;
          setPendingRemove(null);
          onRemove(member);
        }}
      />
    </>
  );
}
