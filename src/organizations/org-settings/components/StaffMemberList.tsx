import { useState } from "react";
import { UserCard } from "@/organizations/user-card/UserCard";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Select } from "@/ui/Select";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import type { StaffMemberRow } from "../hooks/useOrgStaff";

export function StaffMemberList({
  orgSlug,
  members,
  changingId,
  removingId,
  onChangeRole,
  onRemove,
}: {
  orgSlug: string;
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
        No owners, admins, instructors, or parents yet.
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
                <UserCard
                  orgSlug={orgSlug}
                  userId={member.userId}
                  name={displayName}
                />
                {member.isYou ? (
                  <p className="pl-11 text-[12.5px] font-bold text-[var(--ink-faint)]">
                    You
                  </p>
                ) : null}
                {member.name ? (
                  <p className="truncate pl-11 text-[12.5px] text-[var(--ink-faint)]">
                    {member.email}
                  </p>
                ) : null}
              </div>

              {member.canChangeRole ? (
                <label>
                  <span className="sr-only">Role for {displayName}</span>
                  <Select
                    size="compact"
                    value={member.role}
                    disabled={busy}
                    onChange={(event) => onChangeRole(member, event.target.value)}
                  >
                    {member.changeRoles.map((option) => (
                      <option key={option} value={option}>
                        {roleLabel(option)}
                      </option>
                    ))}
                  </Select>
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
        title="Remove collaborator?"
        body={
          pendingRemove?.isYou
            ? "You’ll no longer be a collaborator in this organization until someone invites you again."
            : `${pendingName} will no longer be a collaborator in this organization until you invite them again.`
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
