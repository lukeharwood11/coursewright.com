import type { FormEvent } from "react";
import type { StaffInviteRole } from "@/organizations/model/role";
import type { PendingStaffInvite } from "@/organizations/databridge/staffInvites";
import type { OrgPeopleMemberRow } from "../hooks/useOrgPeople";
import type { StaffMemberRow } from "../hooks/useOrgStaff";
import { InviteStaffForm } from "./InviteStaffForm";
import { PendingInviteList } from "./PendingInviteList";
import { StaffMemberList } from "./StaffMemberList";

export function CollaboratorsPanel({
  orgSlug,
  canInvite,
  loading,
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
  accessByMembershipId,
  busyMembershipId,
  removingCollaboratorId,
  onSuspend,
  onReactivate,
  onRemoveFromOrg,
  onRemoveAsCollaborator,
  onNameChange,
  onEmailChange,
  onRoleChange,
  onInvite,
  onCopy,
  onSendEmail,
  onCancel,
  onChangeRole,
}: {
  orgSlug: string;
  canInvite: boolean;
  loading: boolean;
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
  accessByMembershipId: Map<number, OrgPeopleMemberRow>;
  busyMembershipId: number | null;
  removingCollaboratorId: number | null;
  onSuspend: (member: OrgPeopleMemberRow) => void;
  onReactivate: (member: OrgPeopleMemberRow) => void;
  onRemoveFromOrg: (member: OrgPeopleMemberRow) => void;
  onRemoveAsCollaborator: (staff: StaffMemberRow) => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: StaffInviteRole) => void;
  onInvite: (event: FormEvent) => void;
  onCopy: (invite: PendingStaffInvite) => void;
  onSendEmail: (invite: PendingStaffInvite) => void;
  onCancel: (invite: PendingStaffInvite) => void;
  onChangeRole: (member: StaffMemberRow, nextRole: string) => void;
}) {
  return (
    <>
      <p className="text-[13px] leading-relaxed text-[var(--ink-soft)]">
        Invite staff, change roles, and manage pending collaborator invites.
      </p>

      {loading ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading collaborators…</p>
      ) : null}

      {!loading ? (
        <StaffMemberList
          orgSlug={orgSlug}
          members={members}
          accessByMembershipId={accessByMembershipId}
          changingId={changingId}
          busyMembershipId={busyMembershipId}
          removingCollaboratorId={removingCollaboratorId}
          onChangeRole={onChangeRole}
          onSuspend={onSuspend}
          onReactivate={onReactivate}
          onRemoveFromOrg={onRemoveFromOrg}
          onRemoveAsCollaborator={onRemoveAsCollaborator}
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

          <h3 className="mt-6 text-[13px] font-bold text-[var(--ink-soft)]">
            Pending invites
          </h3>
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
    </>
  );
}
