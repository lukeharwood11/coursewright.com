import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import type { PendingOrgInvite, ParentLinkStatus } from "@/organizations/databridge/staffInvites";
import type { OrgPerson } from "@/organizations/databridge/memberships";
import {
  isValidInviteEmail,
  normalizeInviteEmail,
} from "@/organizations/model/staffInvite";

export function ParentInvitePanel({
  parentEmail,
  canInvite,
  loading,
  loadError: _loadError,
  pending,
  linked,
  addEmail,
  invitingEmail,
  cancelingId,
  sendingId,
  copiedId,
  origin,
  orgMemberForEmail,
  onAddEmailChange,
  onInvite,
  onCopy,
  onSendEmail,
  onCancel,
}: {
  parentEmail: string | null;
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
  orgMemberForEmail: (email: string) => OrgPerson | null;
  onAddEmailChange: (value: string) => void;
  onInvite: (email: string) => void;
  onCopy: (invite: PendingOrgInvite) => void;
  onSendEmail: (invite: PendingOrgInvite) => void;
  onCancel: (invite: PendingOrgInvite) => void;
}) {
  if (!canInvite) return null;

  const pendingEmails = new Set(
    pending.map((invite) => normalizeInviteEmail(invite.email)),
  );
  const linkedEmails = new Set(
    linked.map((row) => row.email.trim().toLowerCase()).filter(Boolean),
  );
  const normalizedParentEmail = parentEmail
    ? normalizeInviteEmail(parentEmail)
    : "";
  const savedParentLinked = normalizedParentEmail
    ? linkedEmails.has(normalizedParentEmail)
    : false;
  const savedParentPending = normalizedParentEmail
    ? pendingEmails.has(normalizedParentEmail)
    : false;
  const savedParentOrgMember =
    parentEmail && !savedParentLinked && !savedParentPending
      ? orgMemberForEmail(parentEmail)
      : null;
  const savedParentReady =
    Boolean(parentEmail) && !savedParentPending && !savedParentLinked;
  const hasParents = linked.length > 0 || pending.length > 0 || Boolean(parentEmail);

  const addEmailTrimmed = addEmail.trim();
  const addEmailNormalized = isValidInviteEmail(addEmailTrimmed)
    ? normalizeInviteEmail(addEmailTrimmed)
    : "";
  const addEmailLinked = addEmailNormalized
    ? linkedEmails.has(addEmailNormalized)
    : false;
  const addEmailPending = addEmailNormalized
    ? pending.some((invite) => normalizeInviteEmail(invite.email) === addEmailNormalized)
    : false;
  const addEmailOrgMember =
    addEmailTrimmed && !addEmailLinked && !addEmailPending
      ? orgMemberForEmail(addEmailTrimmed)
      : null;
  const canSubmitAddEmail =
    Boolean(addEmailTrimmed) && !addEmailLinked && invitingEmail == null;

  return (
    <section className="max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Parents</h2>

      {loading ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading parents…</p>
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
          {savedParentOrgMember ? (
            <p className="mb-2 text-[13px] text-[var(--ink-soft)]">
              {savedParentOrgMember.name} is already in this organization — link them
              as a parent.
            </p>
          ) : null}
          <Button
            onClick={() => onInvite(parentEmail)}
            disabled={invitingEmail === normalizeInviteEmail(parentEmail)}
          >
            {invitingEmail === normalizeInviteEmail(parentEmail)
              ? savedParentOrgMember
                ? "Linking…"
                : "Creating…"
              : savedParentOrgMember
                ? `Link ${parentEmail}`
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
              <Button type="submit" disabled={!canSubmitAddEmail}>
                {invitingEmail && invitingEmail === addEmailNormalized
                  ? addEmailOrgMember
                    ? "Linking…"
                    : "Creating…"
                  : addEmailOrgMember
                    ? "Link"
                    : "Invite"}
              </Button>
            </div>
            {addEmailOrgMember ? (
              <p className="text-[13px] text-[var(--ink-soft)]">
                {addEmailOrgMember.name} is already in this organization — link them as a
                parent.
              </p>
            ) : null}
            {addEmailLinked ? (
              <p className="text-[13px] text-[var(--ink-soft)]">
                That parent is already linked to this student.
              </p>
            ) : null}
          </label>
        </form>
      ) : null}
    </section>
  );
}
