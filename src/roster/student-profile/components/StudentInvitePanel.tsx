import { OrgPersonAccountCard } from "./OrgPersonAccountCard";
import type {
  PendingOrgInvite,
  StudentAccountLink,
} from "@/organizations/databridge/staffInvites";

export function StudentInvitePanel({
  orgSlug,
  studentOrgProfileId,
  displayName,
  contactEmail,
  studentEmail,
  canInvite,
  loading,
  account,
  pending,
  inviting,
  cancelingId,
  sendingId,
  copiedId,
  origin,
  onInvite,
  onCopy,
  onSendEmail,
  onCancel,
}: {
  orgSlug: string;
  studentOrgProfileId: number;
  displayName: string;
  contactEmail: string | null;
  studentEmail: string | null;
  canInvite: boolean;
  loading: boolean;
  account: StudentAccountLink | null;
  pending: PendingOrgInvite[];
  inviting: boolean;
  cancelingId: number | null;
  sendingId: number | null;
  copiedId: number | null;
  origin: string;
  onInvite: () => void;
  onCopy: (invite: PendingOrgInvite) => void;
  onSendEmail: (invite: PendingOrgInvite) => void;
  onCancel: (invite: PendingOrgInvite) => void;
}) {
  if (!canInvite) return null;

  const email = contactEmail ?? studentEmail;
  const cardName = account?.name ?? displayName;
  const cardEmail = account?.email ?? email;
  const pendingForEmail = studentEmail
    ? pending.find((invite) => invite.email === studentEmail)
    : null;
  const activeInvite = pendingForEmail ?? null;
  const canSend =
    Boolean(studentEmail) && !account && !pendingForEmail && !inviting;

  return (
    <section className="max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Student account</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-soft)]">
        Their profile is the place for name and contact email. Send an invite when they
        should sign in and see their own work.
      </p>

      {loading ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading student account…</p>
      ) : null}

      {!loading ? (
        <div className="mt-4">
          <OrgPersonAccountCard
            orgSlug={orgSlug}
            orgProfileId={studentOrgProfileId}
            name={cardName}
            email={cardEmail || null}
            claimed={Boolean(account)}
            invite={activeInvite}
            canSendInvite={canSend}
            inviteCreating={inviting}
            inviteButtonVariant="primary"
            origin={origin}
            copiedId={copiedId}
            sendingId={sendingId}
            cancelingId={cancelingId}
            onInvite={canSend ? onInvite : undefined}
            onCopy={onCopy}
            onSendEmail={onSendEmail}
            onCancel={onCancel}
            noEmailHint="Add a contact email on their profile"
          />
        </div>
      ) : null}
    </section>
  );
}
