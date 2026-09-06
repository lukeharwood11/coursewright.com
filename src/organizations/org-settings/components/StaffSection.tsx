import type { FormEvent } from "react";
import { Input } from "@/ui/Input";
import { Button } from "@/ui/Button";
import type { StaffInviteRole } from "@/organizations/model/role";
import type {
  OrgStaffMember,
  PendingStaffInvite,
} from "@/organizations/databridge/staffInvites";
import { InviteStaffForm } from "./InviteStaffForm";
import { PendingInviteList } from "./PendingInviteList";
import { StaffMemberList } from "./StaffMemberList";

export function StaffSection({
  canInvite,
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
  cancelingId,
  lastInviteUrl,
  lastInvite,
  onEmailChange,
  onRoleChange,
  onInvite,
  onCopy,
  onCancel,
}: {
  canInvite: boolean;
  loading: boolean;
  loadError: string | null;
  members: OrgStaffMember[];
  pending: PendingStaffInvite[];
  email: string;
  role: StaffInviteRole;
  roles: StaffInviteRole[];
  formError: string | null;
  inviting: boolean;
  copiedId: string | null;
  cancelingId: string | null;
  lastInviteUrl: string | null;
  lastInvite: PendingStaffInvite | null;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: StaffInviteRole) => void;
  onInvite: (event: FormEvent) => void;
  onCopy: (invite: PendingStaffInvite) => void;
  onCancel: (invite: PendingStaffInvite) => void;
}) {
  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Staff</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        {canInvite
          ? "Invite an owner, admin, or instructor. Copy the link and send it yourself — Course Wright doesn’t email invites yet."
          : "Owners, admins, and instructors in this organization."}
      </p>

      {loading ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading staff…</p>
      ) : null}

      {loadError ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
          {loadError}
        </p>
      ) : null}

      {!loading ? <StaffMemberList members={members} /> : null}

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

          {lastInviteUrl ? (
            <div className="mt-4 rounded-[10px] border border-[var(--green)] bg-[var(--green-tint)] p-3">
              <p className="text-[13.5px] font-bold text-[var(--green-deep)]">
                Invite created. Copy this link and send it.
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input
                  className="min-w-0 flex-1"
                  readOnly
                  value={lastInviteUrl}
                  onFocus={(event) => event.currentTarget.select()}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (lastInvite) onCopy(lastInvite);
                  }}
                >
                  Copy link
                </Button>
              </div>
            </div>
          ) : null}

          <h3 className="mt-6 text-[13px] font-bold text-[var(--ink-soft)]">Pending invites</h3>
          <PendingInviteList
            invites={pending}
            copiedId={copiedId}
            cancelingId={cancelingId}
            onCopy={onCopy}
            onCancel={onCancel}
          />
        </>
      ) : null}
    </section>
  );
}
