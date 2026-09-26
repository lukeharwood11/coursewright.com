import { useState } from "react";
import {
  ClipboardDocumentIcon,
  EnvelopeIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Input } from "@/ui/Input";
import type { PendingOrgInvite, ParentLinkStatus } from "@/organizations/databridge/staffInvites";
import {
  isValidInviteEmail,
  normalizeInviteEmail,
} from "@/organizations/model/staffInvite";
import {
  OrgPersonAccountCard,
  orgPersonInviteCreating,
} from "./OrgPersonAccountCard";

export function ParentInvitePanel({
  orgSlug,
  parentEmail,
  canInvite,
  loading,
  loadError: _loadError,
  pending,
  linked,
  addName,
  addEmail,
  addingParent,
  invitingEmail,
  removingParentOrgProfileId,
  cancelingId,
  sendingId,
  copiedId,
  origin,
  pendingInviteForEmail,
  onAddNameChange,
  onAddEmailChange,
  onAddParent,
  onAddSavedParentEmail,
  onInvite,
  onRemove,
  onCopy,
  onSendEmail,
  onCancel,
}: {
  orgSlug: string;
  parentEmail: string | null;
  canInvite: boolean;
  loading: boolean;
  loadError: string | null;
  pending: PendingOrgInvite[];
  linked: ParentLinkStatus[];
  addName: string;
  addEmail: string;
  addingParent: boolean;
  invitingEmail: string | null;
  removingParentOrgProfileId: number | null;
  cancelingId: number | null;
  sendingId: number | null;
  copiedId: number | null;
  origin: string;
  pendingInviteForEmail: (email: string) => PendingOrgInvite | null;
  onAddNameChange: (value: string) => void;
  onAddEmailChange: (value: string) => void;
  onAddParent: () => void;
  onAddSavedParentEmail: (name: string, email: string) => void;
  onInvite: (email: string, orgProfileId?: number) => void;
  onRemove: (parent: ParentLinkStatus) => void;
  onCopy: (invite: PendingOrgInvite) => void;
  onSendEmail: (invite: PendingOrgInvite) => void;
  onCancel: (invite: PendingOrgInvite) => void;
}) {
  const [pendingRemove, setPendingRemove] = useState<ParentLinkStatus | null>(null);

  if (!canInvite) return null;

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
    ? Boolean(pendingInviteForEmail(parentEmail ?? ""))
    : false;
  const savedParentReady =
    Boolean(parentEmail) && !savedParentPending && !savedParentLinked;
  const hasParents = linked.length > 0 || pending.length > 0 || Boolean(parentEmail);

  const addNameTrimmed = addName.trim();
  const addEmailTrimmed = addEmail.trim();
  const addEmailNormalized = isValidInviteEmail(addEmailTrimmed)
    ? normalizeInviteEmail(addEmailTrimmed)
    : "";
  const addEmailLinked = addEmailNormalized
    ? linkedEmails.has(addEmailNormalized)
    : false;
  const canSubmitAdd =
    Boolean(addNameTrimmed) && !addEmailLinked && !addingParent;

  const orphanPending = pending.filter(
    (invite) =>
      !linked.some(
        (parent) =>
          parent.email &&
          normalizeInviteEmail(parent.email) === normalizeInviteEmail(invite.email),
      ),
  );

  return (
    <section className="max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Parents</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-soft)]">
        Add a parent with a name and optional email, then send an invite when you’re
        ready.
      </p>

      {loading ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading parents…</p>
      ) : null}

      {!loading && linked.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3">
          {linked.map((parent) => {
            const invite = parent.email
              ? pendingInviteForEmail(parent.email)
              : null;
            const canSendInvite =
              Boolean(parent.email) &&
              !parent.parentUserId &&
              !invite &&
              isValidInviteEmail(parent.email);
            return (
              <li key={parent.parentOrgProfileId}>
                <OrgPersonAccountCard
                  orgSlug={orgSlug}
                  orgProfileId={parent.parentOrgProfileId}
                  name={parent.name}
                  email={parent.email || null}
                  claimed={Boolean(parent.parentUserId)}
                  invite={invite}
                  canSendInvite={canSendInvite}
                  inviteCreating={orgPersonInviteCreating(
                    parent.email,
                    invitingEmail,
                  )}
                  removing={
                    removingParentOrgProfileId === parent.parentOrgProfileId
                  }
                  copiedId={copiedId}
                  sendingId={sendingId}
                  cancelingId={cancelingId}
                  origin={origin}
                  onInvite={
                    canSendInvite
                      ? () =>
                          onInvite(parent.email, parent.parentOrgProfileId)
                      : undefined
                  }
                  onRemove={() => setPendingRemove(parent)}
                  onCopy={onCopy}
                  onSendEmail={onSendEmail}
                  onCancel={onCancel}
                />
              </li>
            );
          })}
        </ul>
      ) : null}

      <ConfirmDialog
        open={pendingRemove != null}
        title="Remove parent from this student?"
        body={
          pendingRemove
            ? `${pendingRemove.name} will no longer be linked to this student. If they aren’t linked to anyone else in the organization, their profile here will be removed too.`
            : ""
        }
        confirmLabel="Remove"
        cancelLabel="Keep link"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (!pendingRemove) return;
          const parent = pendingRemove;
          setPendingRemove(null);
          onRemove(parent);
        }}
      />

      {!loading && orphanPending.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3">
          {orphanPending.map((invite) => (
            <li key={invite.id}>
              {invite.orgProfileId != null ? (
                <OrgPersonAccountCard
                  orgSlug={orgSlug}
                  orgProfileId={invite.orgProfileId}
                  name={invite.name?.trim() || invite.email}
                  email={invite.email}
                  claimed={Boolean(invite.userId)}
                  invite={invite}
                  canSendInvite={false}
                  inviteCreating={false}
                  copiedId={copiedId}
                  sendingId={sendingId}
                  cancelingId={cancelingId}
                  origin={origin}
                  onCopy={onCopy}
                  onSendEmail={onSendEmail}
                  onCancel={onCancel}
                />
              ) : (
                <div className="rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-3">
                  <p className="text-[14px] font-bold text-[var(--ink)]">
                    {invite.name?.trim() || invite.email}
                  </p>
                  <p className="text-[12.5px] text-[var(--ink-soft)]">{invite.email}</p>
                  <p className="mt-1 text-[12px] text-[var(--ink-faint)]">
                    Not claimed yet — invite waiting on them
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
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
                      {sendingId === invite.id ? "Sending…" : "Resend email"}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={cancelingId === invite.id}
                      onClick={() => onCancel(invite)}
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden />
                      {cancelingId === invite.id ? "Canceling…" : "Cancel invite"}
                    </Button>
                  </div>
                  <div className="mt-3">
                    <Input
                      className="w-full"
                      readOnly
                      value={`${origin}/invite/${invite.token}`}
                      onFocus={(event) => event.currentTarget.select()}
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && savedParentReady && parentEmail ? (
        <div className="mt-4 rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-3">
          <p className="text-[13px] text-[var(--ink-soft)]">
            On this student’s record:{" "}
            <span className="font-bold text-[var(--ink)]">{parentEmail}</span>
          </p>
          <Button
            className="mt-2"
            variant="secondary"
            disabled={addingParent}
            onClick={() =>
              onAddSavedParentEmail(
                parentEmail.split("@")[0] || "Parent",
                parentEmail,
              )
            }
          >
            <UserPlusIcon className="h-5 w-5" aria-hidden />
            {addingParent ? "Adding…" : "Add"}
          </Button>
        </div>
      ) : null}

      {!loading ? (
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            onAddParent();
          }}
        >
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            {hasParents ? "Add another parent" : "Add a parent"}
          </span>
          <div className="mt-2 flex flex-col gap-2">
            <Input
              className="w-full"
              value={addName}
              onChange={(event) => onAddNameChange(event.target.value)}
              placeholder="Name"
              autoComplete="name"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                className="min-w-0 flex-1"
                type="email"
                value={addEmail}
                onChange={(event) => onAddEmailChange(event.target.value)}
                placeholder="Email (optional)"
                autoComplete="off"
              />
              <Button type="submit" disabled={!canSubmitAdd}>
                <UserPlusIcon className="h-5 w-5" aria-hidden />
                {addingParent ? "Adding…" : "Add"}
              </Button>
            </div>
            {addEmailLinked ? (
              <p className="text-[13px] text-[var(--ink-soft)]">
                That parent is already linked to this student.
              </p>
            ) : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}
