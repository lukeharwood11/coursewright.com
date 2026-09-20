import type { FormEvent } from "react";
import type { StaffInviteRole } from "@/organizations/model/role";
import type { PendingStaffInvite } from "@/organizations/databridge/staffInvites";
import type { StaffMemberRow } from "../hooks/useOrgStaff";
import { InviteStaffForm } from "./InviteStaffForm";
import { PendingInviteList } from "./PendingInviteList";
import { StaffMemberList } from "./StaffMemberList";

export function StaffSection({
  canInvite,
  canManage,
  loading,
  loadError,
  members,
  pending,
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
  lastInviteSent,
  onEmailChange,
  onRoleChange,
  onInvite,
  onCopy,
  onSendEmail,
  onCancel,
  onChangeRole,
  onRemove,
}: {
  canInvite: boolean;
  canManage: boolean;
  loading: boolean;
  loadError: string | null;
  members: StaffMemberRow[];
  pending: PendingStaffInvite[];
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
  lastInviteSent: boolean;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: StaffInviteRole) => void;
  onInvite: (event: FormEvent) => void;
  onCopy: (invite: PendingStaffInvite) => void;
  onSendEmail: (invite: PendingStaffInvite) => void;
  onCancel: (invite: PendingStaffInvite) => void;
  onChangeRole: (member: StaffMemberRow, nextRole: string) => void;
  onRemove: (member: StaffMemberRow) => void;
}) {
  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Collaborators</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        {canManage
          ? "Invite an owner, admin, or instructor. We’ll email them a link to join."
          : "Owners, admins, and instructors in this organization."}
      </p>

      {loading ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading collaborators…</p>
      ) : null}

      {loadError ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
          {loadError}
        </p>
      ) : null}

      {!loading ? (
        <StaffMemberList
          members={members}
          changingId={changingId}
          removingId={removingId}
          onChangeRole={onChangeRole}
          onRemove={onRemove}
        />
      ) : null}

      {canInvite ? (
        <>
          <InviteStaffForm
            email={email}
            role={role}
            roles={roles}
            error={formError}
            submitting={inviting}
            onEmailChange={onEmailChange}
            onRoleChange={onRoleChange}
            onSubmit={onInvite}
          />

          {lastInviteSent ? (
            <div className="mt-4 rounded-[10px] border border-[var(--green)] bg-[var(--green-tint)] p-3">
              <p className="text-[13.5px] font-bold text-[var(--green-deep)]">
                Email invite sent!
              </p>
            </div>
          ) : null}

          <h3 className="mt-6 text-[13px] font-bold text-[var(--ink-soft)]">Pending invites</h3>
          <PendingInviteList
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
