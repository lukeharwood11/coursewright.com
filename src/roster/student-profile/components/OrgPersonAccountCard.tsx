import { Link } from "react-router-dom";
import {
  ClipboardDocumentIcon,
  EnvelopeIcon,
  MinusIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button, ButtonLink } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { orgPersonProfilePath } from "@/organizations/model/paths";
import type { PendingOrgInvite } from "@/organizations/databridge/staffInvites";
import { normalizeInviteEmail } from "@/organizations/model/staffInvite";

type InviteButtonVariant = "primary" | "secondary";

export function OrgPersonAccountCard({
  orgSlug,
  orgProfileId,
  name,
  email,
  claimed,
  invite,
  canSendInvite,
  inviteCreating,
  inviteButtonVariant = "secondary",
  removing,
  origin,
  copiedId,
  sendingId,
  cancelingId,
  onInvite,
  onRemove,
  onCopy,
  onSendEmail,
  onCancel,
  noEmailHint = "Add email on their profile",
}: {
  orgSlug: string;
  orgProfileId: number;
  name: string;
  email: string | null;
  claimed: boolean;
  invite: PendingOrgInvite | null;
  canSendInvite: boolean;
  inviteCreating: boolean;
  inviteButtonVariant?: InviteButtonVariant;
  removing?: boolean;
  origin: string;
  copiedId: number | null;
  sendingId: number | null;
  cancelingId: number | null;
  onInvite?: () => void;
  onRemove?: () => void;
  onCopy: (invite: PendingOrgInvite) => void;
  onSendEmail: (invite: PendingOrgInvite) => void;
  onCancel: (invite: PendingOrgInvite) => void;
  noEmailHint?: string;
}) {
  const profilePath = orgPersonProfilePath(orgSlug, orgProfileId);
  let status: string;
  if (claimed) {
    status = "Has an account in this organization";
  } else if (invite) {
    status = "Not claimed yet — invite waiting on them";
  } else if (email) {
    status = "Not claimed yet — send an invite when you’re ready";
  } else {
    status = "Not claimed yet — add a contact email on their profile";
  }

  return (
    <div className="rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-3">
      <p className="text-[14px] font-bold text-[var(--ink)]">{name}</p>
      {email ? (
        <p className="text-[12.5px] text-[var(--ink-soft)]">{email}</p>
      ) : (
        <p className="text-[12.5px] text-[var(--ink-faint)]">No contact email</p>
      )}
      <p className="mt-1 text-[12px] text-[var(--ink-faint)]">{status}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <ButtonLink variant="secondary" to={profilePath}>
          <UserCircleIcon className="h-5 w-5" aria-hidden />
          Profile
        </ButtonLink>
        {invite ? (
          <>
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
              {cancelingId === invite.id ? "Canceling…" : "Cancel invite"}
            </Button>
          </>
        ) : canSendInvite && onInvite ? (
          <Button
            variant={inviteButtonVariant}
            disabled={inviteCreating}
            onClick={onInvite}
          >
            <PaperAirplaneIcon className="h-5 w-5" aria-hidden />
            {inviteCreating ? "Creating…" : "Invite"}
          </Button>
        ) : null}
        {onRemove ? (
          <Button type="button" variant="secondary" disabled={removing} onClick={onRemove}>
            <MinusIcon className="h-5 w-5" aria-hidden />
            {removing ? "Removing…" : "Remove"}
          </Button>
        ) : null}
      </div>

      {invite ? (
        <div className="mt-3">
          <Input
            className="w-full"
            readOnly
            value={`${origin}/invite/${invite.token}`}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      ) : null}

      {!email && !claimed ? (
        <p className="mt-2 text-[12.5px] text-[var(--ink-soft)]">
          <Link
            to={profilePath}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            {noEmailHint}
          </Link>{" "}
          before sending an invite.
        </p>
      ) : null}
    </div>
  );
}

export function orgPersonInviteCreating(
  email: string | null,
  invitingEmail: string | null,
): boolean {
  if (!email || !invitingEmail) return false;
  return invitingEmail === normalizeInviteEmail(email);
}
