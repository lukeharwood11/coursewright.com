import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import type { PendingStaffInvite } from "@/organizations/databridge/staffInvites";

export function PendingInviteList({
  invites,
  copiedId,
  cancelingId,
  onCopy,
  onCancel,
}: {
  invites: PendingStaffInvite[];
  copiedId: string | null;
  cancelingId: string | null;
  onCopy: (invite: PendingStaffInvite) => void;
  onCancel: (invite: PendingStaffInvite) => void;
}) {
  if (invites.length === 0) {
    return (
      <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
        No pending invites. Course Wright doesn’t email the link — copy it and send it
        yourself.
      </p>
    );
  }

  return (
    <ul className="mt-3 divide-y divide-[var(--line-soft)]">
      {invites.map((invite) => (
        <li key={invite.id} className="flex flex-wrap items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-extrabold text-[var(--ink)]">
              {invite.email}
            </p>
            <p className="text-[12.5px] text-[var(--ink-faint)]">Waiting to accept</p>
          </div>
          <Badge variant={roleBadgeVariant(invite.role)}>{roleLabel(invite.role)}</Badge>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onCopy(invite)}>
              {copiedId === invite.id ? "Copied" : "Copy link"}
            </Button>
            <Button
              variant="secondary"
              disabled={cancelingId === invite.id}
              onClick={() => onCancel(invite)}
            >
              {cancelingId === invite.id ? "Canceling…" : "Cancel"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
