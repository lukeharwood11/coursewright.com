import { Link } from "react-router-dom";
import {
  ClipboardDocumentIcon,
  EnvelopeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import { orgVisibleProfilePath } from "@/organizations/model/paths";
import type { PendingStaffInvite } from "@/organizations/databridge/staffInvites";

export function PendingInviteList({
  orgSlug,
  invites,
  copiedId,
  sendingId,
  cancelingId,
  onCopy,
  onSendEmail,
  onCancel,
}: {
  orgSlug: string;
  invites: PendingStaffInvite[];
  copiedId: number | null;
  sendingId: number | null;
  cancelingId: number | null;
  onCopy: (invite: PendingStaffInvite) => void;
  onSendEmail: (invite: PendingStaffInvite) => void;
  onCancel: (invite: PendingStaffInvite) => void;
}) {
  if (invites.length === 0) {
    return (
      <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
        No pending invites.
      </p>
    );
  }

  return (
    <ul className="mt-3 divide-y divide-[var(--line-soft)]">
      {invites.map((invite) => {
        const displayName = invite.name?.trim() || invite.email;
        const profileHref = orgVisibleProfilePath(orgSlug, {
          orgProfileId: invite.orgProfileId,
          userId: invite.userId,
        });

        return (
          <li key={invite.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              {profileHref ? (
                <Link
                  to={profileHref}
                  className="truncate text-[14.5px] font-extrabold text-[var(--ink)] hover:text-[var(--green-deep)]"
                >
                  {displayName}
                </Link>
              ) : (
                <p className="truncate text-[14.5px] font-extrabold text-[var(--ink)]">
                  {displayName}
                </p>
              )}
              {invite.name?.trim() && invite.name.trim() !== invite.email ? (
                <p className="truncate text-[12.5px] text-[var(--ink-faint)]">
                  {invite.email}
                </p>
              ) : null}
              <p className="text-[12.5px] text-[var(--ink-faint)]">
                Waiting to accept
              </p>
            </div>
            <Badge variant={roleBadgeVariant(invite.role)}>{roleLabel(invite.role)}</Badge>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => onCopy(invite)}>
                <ClipboardDocumentIcon className="h-5 w-5" aria-hidden />
                {copiedId === invite.id ? "Copied" : "Copy link"}
              </Button>
              <Button
                variant="secondary"
                disabled={sendingId === invite.id}
                onClick={() => onSendEmail(invite)}
              >
                <EnvelopeIcon className="h-5 w-5" aria-hidden />
                {sendingId === invite.id ? "Sending…" : "Send email"}
              </Button>
              <Button
                variant="secondary"
                disabled={cancelingId === invite.id}
                onClick={() => onCancel(invite)}
              >
                <XMarkIcon className="h-5 w-5" aria-hidden />
                {cancelingId === invite.id ? "Canceling…" : "Cancel"}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
