import { useState } from "react";
import type { FormEvent } from "react";
import {
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Tab, TabList } from "@/ui/Tabs";
import { useToastOnError } from "@/ui/useToastOnError";
import type { StaffInviteRole } from "@/organizations/model/role";
import type { PendingStaffInvite } from "@/organizations/databridge/staffInvites";
import type { OrgPeopleMemberRow } from "../hooks/useOrgPeople";
import type { StaffMemberRow } from "../hooks/useOrgStaff";
import { CollaboratorsPanel } from "./CollaboratorsPanel";
import { OrgPeopleMemberRow as OrgPeopleMemberRowView } from "./OrgPeopleMemberRow";

type PeopleSubview = "collaborators" | "access";

function PeopleSectionTitle() {
  return (
    <div className="flex items-center gap-2">
      <UserGroupIcon className="h-4 w-4 shrink-0 text-[var(--ink-soft)]" aria-hidden />
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">People</h2>
    </div>
  );
}

export function PeopleSection({
  orgSlug,
  canManagePeople,
  canInvite,
  staffLoading,
  staffLoadError,
  staffMembers,
  pending,
  inviteName,
  inviteEmail,
  inviteRole,
  inviteRoles,
  inviteFormError,
  inviting,
  copiedId,
  sendingId,
  cancelingId,
  changingId,
  onInviteNameChange,
  onInviteEmailChange,
  onInviteRoleChange,
  onInvite,
  onCopy,
  onSendEmail,
  onCancelInvite,
  onChangeRole,
  peopleLoading,
  peopleLoadError,
  accessMembers,
  busyMembershipId,
  removingCollaboratorId,
  onSuspend,
  onReactivate,
  onRemoveFromOrg,
  onRemoveAsCollaborator,
}: {
  orgSlug: string;
  canManagePeople: boolean;
  canInvite: boolean;
  staffLoading: boolean;
  staffLoadError: string | null;
  staffMembers: StaffMemberRow[];
  pending: PendingStaffInvite[];
  inviteName: string;
  inviteEmail: string;
  inviteRole: StaffInviteRole;
  inviteRoles: StaffInviteRole[];
  inviteFormError: string | null;
  inviting: boolean;
  copiedId: number | null;
  sendingId: number | null;
  cancelingId: number | null;
  changingId: number | null;
  onInviteNameChange: (value: string) => void;
  onInviteEmailChange: (value: string) => void;
  onInviteRoleChange: (value: StaffInviteRole) => void;
  onInvite: (event: FormEvent) => void;
  onCopy: (invite: PendingStaffInvite) => void;
  onSendEmail: (invite: PendingStaffInvite) => void;
  onCancelInvite: (invite: PendingStaffInvite) => void;
  onChangeRole: (member: StaffMemberRow, nextRole: string) => void;
  peopleLoading: boolean;
  peopleLoadError: string | null;
  accessMembers: OrgPeopleMemberRow[];
  busyMembershipId: number | null;
  removingCollaboratorId: number | null;
  onSuspend: (member: OrgPeopleMemberRow) => void;
  onReactivate: (member: OrgPeopleMemberRow) => void;
  onRemoveFromOrg: (member: OrgPeopleMemberRow) => void;
  onRemoveAsCollaborator: (staff: StaffMemberRow) => void;
}) {
  const canSeeCollaborators =
    canInvite || staffMembers.length > 0 || pending.length > 0;
  const [subview, setSubview] = useState<PeopleSubview>(
    canSeeCollaborators ? "collaborators" : "access",
  );
  useToastOnError(staffLoadError);
  useToastOnError(peopleLoadError);

  const activeSubview =
    subview === "collaborators" && canSeeCollaborators
      ? "collaborators"
      : canManagePeople
        ? "access"
        : "collaborators";

  const accessByMembershipId = new Map(
    accessMembers.map((member) => [member.membershipId, member]),
  );
  const staffByMembershipId = new Map(
    staffMembers.map((member) => [member.membershipId, member]),
  );

  if (!canManagePeople && !canSeeCollaborators) {
    return (
      <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
        <PeopleSectionTitle />
        <p className="mt-2 text-[14px] text-[var(--ink-soft)]">
          Only owners and admins can manage people in this organization.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <PeopleSectionTitle />
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-soft)]">
        Collaborators, roles, and invites. Suspend or remove access for anyone with a
        linked account.
      </p>

      {canSeeCollaborators && canManagePeople ? (
        <div className="mt-4 border-b border-[var(--line-soft)] pb-3">
          <TabList label="People sections">
            <Tab
              selected={activeSubview === "collaborators"}
              onSelect={() => setSubview("collaborators")}
            >
              <span className="inline-flex items-center gap-1.5">
                <UserGroupIcon className="h-4 w-4 shrink-0" aria-hidden />
                Collaborators
              </span>
            </Tab>
            <Tab
              selected={activeSubview === "access"}
              onSelect={() => setSubview("access")}
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheckIcon className="h-4 w-4 shrink-0" aria-hidden />
                Access
              </span>
            </Tab>
          </TabList>
        </div>
      ) : null}

      <div className="mt-4" role="tabpanel">
        {activeSubview === "collaborators" && canSeeCollaborators ? (
          <CollaboratorsPanel
            orgSlug={orgSlug}
            canInvite={canInvite}
            loading={staffLoading}
            members={staffMembers}
            pending={pending}
            name={inviteName}
            email={inviteEmail}
            role={inviteRole}
            roles={inviteRoles}
            formError={inviteFormError}
            inviting={inviting}
            copiedId={copiedId}
            sendingId={sendingId}
            cancelingId={cancelingId}
            changingId={changingId}
            accessByMembershipId={accessByMembershipId}
            busyMembershipId={busyMembershipId}
            removingCollaboratorId={removingCollaboratorId}
            onSuspend={onSuspend}
            onReactivate={onReactivate}
            onRemoveFromOrg={onRemoveFromOrg}
            onRemoveAsCollaborator={onRemoveAsCollaborator}
            onNameChange={onInviteNameChange}
            onEmailChange={onInviteEmailChange}
            onRoleChange={onInviteRoleChange}
            onInvite={onInvite}
            onCopy={onCopy}
            onSendEmail={onSendEmail}
            onCancel={onCancelInvite}
            onChangeRole={onChangeRole}
          />
        ) : null}

        {activeSubview === "access" && canManagePeople ? (
          <>
            <p className="text-[13px] leading-relaxed text-[var(--ink-soft)]">
              Everyone with a linked account. Suspend blocks sign-in temporarily. Remove
              ends all access and unlinks their login from their org profile.
            </p>

            {peopleLoading ? (
              <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading access…</p>
            ) : null}

            {!peopleLoading && accessMembers.length === 0 ? (
              <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
                No one has claimed an account in this organization yet.
              </p>
            ) : null}

            {!peopleLoading && accessMembers.length > 0 ? (
              <ul className="mt-3 divide-y divide-[var(--line-soft)]">
                {accessMembers.map((member) => (
                  <OrgPeopleMemberRowView
                    key={member.membershipId}
                    orgSlug={orgSlug}
                    member={member}
                    staffMember={staffByMembershipId.get(member.membershipId)}
                    busy={
                      busyMembershipId === member.membershipId ||
                      removingCollaboratorId === member.membershipId
                    }
                    onSuspend={onSuspend}
                    onReactivate={onReactivate}
                    onRemoveFromOrg={onRemoveFromOrg}
                    onRemoveAsCollaborator={onRemoveAsCollaborator}
                  />
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
