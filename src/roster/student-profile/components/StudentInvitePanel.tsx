import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import type {
  PendingOrgInvite,
  StudentAccountLink,
} from "@/organizations/databridge/staffInvites";

export function StudentInvitePanel({
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

  const pendingForEmail = pending.find((invite) => invite.email === studentEmail);
  const canSend =
    Boolean(studentEmail) && !account && !pendingForEmail && !inviting;

  return (
    <section className="max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Student account</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        A student invite lets this person sign in and see their own work.
      </p>

      {loading ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading student account…</p>
      ) : null}

      {!loading && account ? (
        <div className="mt-4 rounded-[8px] border border-[var(--line-soft)] px-3 py-2">
          <p className="text-[14px] font-bold text-[var(--ink)]">{account.name}</p>
          <p className="text-[12.5px] text-[var(--ink-soft)]">{account.email}</p>
        </div>
      ) : null}

      {!loading && pending.map((invite) => (
        <div key={invite.id} className="mt-4">
          <p className="text-[13.5px] text-[var(--ink-soft)]">
            Waiting on <span className="font-bold text-[var(--ink)]">{invite.email}</span>
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              className="min-w-0 flex-1"
              readOnly
              value={`${origin}/invite/${invite.token}`}
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button variant="secondary" onClick={() => onCopy(invite)}>
              {copiedId === invite.id ? "Copied" : "Copy link"}
            </Button>
            <Button
              variant="secondary"
              disabled={sendingId === invite.id}
              onClick={() => onSendEmail(invite)}
            >
              {sendingId === invite.id ? "Sending…" : "Resend email"}
            </Button>
            <Button
              variant="secondary"
              disabled={cancelingId === invite.id}
              onClick={() => onCancel(invite)}
            >
              {cancelingId === invite.id ? "Canceling…" : "Cancel"}
            </Button>
          </div>
        </div>
      ))}

      {!loading && canSend && studentEmail ? (
        <div className="mt-4">
          <Button onClick={onInvite} disabled={inviting}>
            {inviting ? "Creating…" : `Invite ${studentEmail}`}
          </Button>
        </div>
      ) : null}

      {!loading && !studentEmail && !account ? (
        <p className="mt-4 text-[13.5px] text-[var(--ink-soft)]">
          Save a student email above if they should see this work themselves.
        </p>
      ) : null}
    </section>
  );
}
