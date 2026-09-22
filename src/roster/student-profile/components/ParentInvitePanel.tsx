import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import type { PendingOrgInvite, ParentLinkStatus } from "@/organizations/databridge/staffInvites";

export function ParentInvitePanel({
  parentEmail,
  studentEmail,
  canInvite,
  loading,
  loadError,
  pending,
  linked,
  addEmail,
  invitingEmail,
  cancelingId,
  sendingId,
  copiedId,
  origin,
  onAddEmailChange,
  onInvite,
  onCopy,
  onSendEmail,
  onCancel,
}: {
  parentEmail: string | null;
  studentEmail: string | null;
  canInvite: boolean;
  loading: boolean;
  loadError: string | null;
  pending: PendingOrgInvite[];
  linked: ParentLinkStatus[];
  addEmail: string;
  invitingEmail: string | null;
  cancelingId: number | null;
  sendingId: number | null;
  copiedId: number | null;
  origin: string;
  onAddEmailChange: (value: string) => void;
  onInvite: (email: string) => void;
  onCopy: (invite: PendingOrgInvite) => void;
  onSendEmail: (invite: PendingOrgInvite) => void;
  onCancel: (invite: PendingOrgInvite) => void;
}) {
  if (!canInvite) return null;

  const pendingEmails = new Set(pending.map((invite) => invite.email));
  const linkedEmails = new Set(
    linked.map((row) => row.email.trim().toLowerCase()).filter(Boolean),
  );
  const savedParentReady =
    Boolean(parentEmail) &&
    !pendingEmails.has(parentEmail ?? "") &&
    !linkedEmails.has(parentEmail ?? "");
  const studentReady =
    Boolean(studentEmail) &&
    studentEmail !== parentEmail &&
    !pendingEmails.has(studentEmail ?? "") &&
    !linkedEmails.has(studentEmail ?? "");
  const hasParents = linked.length > 0 || pending.length > 0 || Boolean(parentEmail);

  return (
    <section className="max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Parents</h2>

      {loading ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading parents…</p>
      ) : null}

      {loadError ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
          {loadError}
        </p>
      ) : null}

      {!loading && linked.length > 0 ? (
        <ul className="mt-4 divide-y divide-[var(--line-soft)] rounded-[8px] border border-[var(--line-soft)]">
          {linked.map((parent) => (
            <li key={parent.parentUserId} className="px-3 py-2">
              <p className="text-[14px] font-bold text-[var(--ink)]">
                {parent.name}
              </p>
              <p className="text-[12.5px] text-[var(--ink-soft)]">{parent.email}</p>
            </li>
          ))}
        </ul>
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

      {!loading && savedParentReady && parentEmail ? (
        <div className="mt-4">
          <Button
            onClick={() => onInvite(parentEmail)}
            disabled={invitingEmail === parentEmail}
          >
            {invitingEmail === parentEmail
              ? "Creating…"
              : `Invite ${parentEmail}`}
          </Button>
        </div>
      ) : null}

      {!loading ? (
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            onInvite(addEmail);
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              {hasParents ? "Add another parent" : "Add a parent"}
            </span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                className="min-w-0 flex-1"
                type="email"
                value={addEmail}
                onChange={(event) => onAddEmailChange(event.target.value)}
                placeholder="parent@email.com"
                autoComplete="off"
              />
              <Button type="submit" disabled={!addEmail.trim() || invitingEmail != null}>
                {invitingEmail && invitingEmail === addEmail.trim().toLowerCase()
                  ? "Creating…"
                  : "Invite"}
              </Button>
            </div>
          </label>
        </form>
      ) : null}

      {studentEmail ? (
        <div className="mt-6 border-t border-[var(--line-soft)] pt-4">
          <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">
            Student email
          </h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-soft)]">
            {studentEmail} can sign in to see this student’s work — same invite
            as a parent, without other children.
          </p>
          {!loading && studentReady ? (
            <div className="mt-3">
              <Button
                onClick={() => onInvite(studentEmail)}
                disabled={invitingEmail === studentEmail}
              >
                {invitingEmail === studentEmail
                  ? "Creating…"
                  : "Invite student email"}
              </Button>
            </div>
          ) : null}
          {!loading && !studentReady ? (
            <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
              This email already has an invite or is linked.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-[13.5px] text-[var(--ink-soft)]">
          Save a student email above if they should see this work themselves.
        </p>
      )}
    </section>
  );
}
