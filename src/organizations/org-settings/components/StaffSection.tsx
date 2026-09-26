import type { FormEvent } from "react";
import { useToastOnError } from "@/ui/useToastOnError";
import type { StaffInviteRole } from "@/organizations/model/role";
import type { PendingStaffInvite } from "@/organizations/databridge/staffInvites";
import type { StaffMemberRow } from "../hooks/useOrgStaff";
import { InviteStaffForm } from "./InviteStaffForm";
import { PendingInviteList } from "./PendingInviteList";
import { StaffMemberList } from "./StaffMemberList";

export function StaffSection({
  orgSlug,
  canInvite,
  loading,
  loadError,
  members,
  pending,
  name,
  email,
  role,
  roles,
  formError,
  inviting,
  copiedId,
  sendingId,
  cancelingId,
  changingId,
  removingId,
  onNameChange,
  onEmailChange,
  onRoleChange,
  onInvite,
  onCopy,
  onSendEmail,
  onCancel,
  onChangeRole,
  onRemove,
}: {
  orgSlug: string;
  canInvite: boolean;
  loading: boolean;
  loadError: string | null;
  members: StaffMemberRow[];
  pending: PendingStaffInvite[];
  name: string;
  email: string;
  role: StaffInviteRole;
  roles: StaffInviteRole[];
  formError: string | null;
  inviting: boolean;
  copiedId: number | null;
  sendingId: number | null;
  cancelingId: number | null;
  changingId: number | null;
  removingId: number | null;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: StaffInviteRole) => void;
  onInvite: (event: FormEvent) => void;
  onCopy: (invite: PendingStaffInvite) => void;
  onSendEmail: (invite: PendingStaffInvite) => void;
  onCancel: (invite: PendingStaffInvite) => void;
  onChangeRole: (member: StaffMemberRow, nextRole: string) => void;
  onRemove: (member: StaffMemberRow) => void;
}) {
  useToastOnError(loadError);

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Collaborators</h2>

      {loading ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading collaborators…</p>
      ) : null}

      {!loading ? (
        <StaffMemberList
          orgSlug={orgSlug}
          members={members}
          changingId={changingId}
          removingId={removingId}
          onChangeRole={onChangeRole}
          onRemove={onRemove}
        />
      ) : null}

      {canInvite ? (
        <>
          <div className="mt-2 border-t border-[var(--line-soft)] pt-5">
            <InviteStaffForm
              name={name}
              email={email}
              role={role}
              roles={roles}
              error={formError}
              submitting={inviting}
              onNameChange={onNameChange}
              onEmailChange={onEmailChange}
              onRoleChange={onRoleChange}
              onSubmit={onInvite}
            />
          </div>

          <h3 className="mt-6 text-[13px] font-bold text-[var(--ink-soft)]">Pending invites</h3>
          <PendingInviteList
            orgSlug={orgSlug}
            invites={pending}
            copiedId={copiedId}
            sendingId={sendingId}
            cancelingId={cancelingId}
            onCopy={onCopy}
            onSendEmail={onSendEmail}
            onCancel={onCancel}
          />
        </>
      ) : null}
    </section>
  );
}
