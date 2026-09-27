import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { Tab, TabList } from "@/ui/Tabs";
import { OrgSettingsSectionTitle } from "./OrgSettingsSectionTitle";
import { useToastOnError } from "@/ui/useToastOnError";
import type { StaffInviteRole } from "@/organizations/model/role";
import type { PendingStaffInvite } from "@/organizations/databridge/staffInvites";
import type { OrgPeopleMemberRow } from "../hooks/useOrgPeople";
import type { StaffMemberRow } from "../hooks/useOrgStaff";
import {
  PEOPLE_SECTION_VIEW_PARAM,
  parsePeopleSectionSubview,
  peopleSectionSubviewSearchValue,
  type PeopleSectionSubview,
} from "@/organizations/model/peopleSectionUrl";
import { CollaboratorsPanel } from "./CollaboratorsPanel";
import { PeopleAccessPanel } from "./PeopleAccessPanel";

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
  const [searchParams, setSearchParams] = useSearchParams();
  useToastOnError(staffLoadError);
  useToastOnError(peopleLoadError);

  const activeSubview = parsePeopleSectionSubview(
    searchParams.get(PEOPLE_SECTION_VIEW_PARAM),
    { canManagePeople, canSeeCollaborators },
  );

  function selectSubview(subview: PeopleSectionSubview) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const value = peopleSectionSubviewSearchValue(subview);
        if (value) next.set(PEOPLE_SECTION_VIEW_PARAM, value);
        else next.delete(PEOPLE_SECTION_VIEW_PARAM);
        return next;
      },
      { replace: true },
    );
  }

  const accessByMembershipId = new Map(
    accessMembers.map((member) => [member.membershipId, member]),
  );
  const staffByMembershipId = new Map(
    staffMembers.map((member) => [member.membershipId, member]),
  );

  if (!canManagePeople && !canSeeCollaborators) {
    return (
      <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
        <OrgSettingsSectionTitle tab="people" />
        <p className="mt-2 text-[14px] text-[var(--ink-soft)]">
          Only owners and admins can manage people in this organization.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <OrgSettingsSectionTitle tab="people" />
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-soft)]">
        Collaborators, roles, and invites. Suspend or remove access for anyone with a
        linked account.
      </p>

      {canSeeCollaborators && canManagePeople ? (
        <div className="mt-4 border-b border-[var(--line-soft)] pb-3">
          <TabList label="People sections">
            <Tab
              selected={activeSubview === "collaborators"}
              onSelect={() => selectSubview("collaborators")}
            >
              <span className="inline-flex items-center gap-1.5">
                <UserGroupIcon className="h-4 w-4 shrink-0" aria-hidden />
                Collaborators
              </span>
            </Tab>
            <Tab
              selected={activeSubview === "access"}
              onSelect={() => selectSubview("access")}
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
          <PeopleAccessPanel
            orgSlug={orgSlug}
            loading={peopleLoading}
            members={accessMembers}
            staffByMembershipId={staffByMembershipId}
            busyMembershipId={busyMembershipId}
            removingCollaboratorId={removingCollaboratorId}
            onSuspend={onSuspend}
            onReactivate={onReactivate}
            onRemoveFromOrg={onRemoveFromOrg}
            onRemoveAsCollaborator={onRemoveAsCollaborator}
          />
        ) : null}
      </div>
    </section>
  );
}
