import { UserCard } from "@/organizations/user-card/UserCard";
import { Badge } from "@/ui/Badge";
import { Select } from "@/ui/Select";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import type { OrgPeopleMemberRow } from "../hooks/useOrgPeople";
import type { StaffMemberRow } from "../hooks/useOrgStaff";
import {
  OrgMemberAccessActions,
  orgMemberAccessModelFromPeopleRow,
} from "./OrgMemberAccessActions";

export function StaffMemberList({
  orgSlug,
  members,
  accessByMembershipId,
  changingId,
  busyMembershipId,
  removingCollaboratorId,
  onChangeRole,
  onSuspend,
  onReactivate,
  onRemoveFromOrg,
  onRemoveAsCollaborator,
}: {
  orgSlug: string;
  members: StaffMemberRow[];
  accessByMembershipId: Map<number, OrgPeopleMemberRow>;
  changingId: number | null;
  busyMembershipId: number | null;
  removingCollaboratorId: number | null;
  onChangeRole: (member: StaffMemberRow, nextRole: string) => void;
  onSuspend: (member: OrgPeopleMemberRow) => void;
  onReactivate: (member: OrgPeopleMemberRow) => void;
  onRemoveFromOrg: (member: OrgPeopleMemberRow) => void;
  onRemoveAsCollaborator: (staff: StaffMemberRow) => void;
}) {
  if (members.length === 0) {
    return (
      <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
        No owners, admins, instructors, or parents yet.
      </p>
    );
  }

  return (
    <ul className="mt-3 divide-y divide-[var(--line-soft)]">
      {members.map((member) => {
        const displayName = member.name || member.email;
        const roleBusy = changingId === member.membershipId;
        const accessMember = accessByMembershipId.get(member.membershipId);
        const accessBusy =
          accessMember != null &&
          (busyMembershipId === accessMember.membershipId ||
            removingCollaboratorId === member.membershipId);

        const rowBody = (
          <>
            <UserCard
              orgSlug={orgSlug}
              orgProfileId={member.orgProfileId}
              userId={member.userId}
              name={member.name || member.email}
              email={member.email}
              isYou={member.isYou}
            />
          </>
        );

        const trailing = (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {member.canChangeRole ? (
              <label>
                <span className="sr-only">Role for {displayName}</span>
                <Select
                  size="compact"
                  value={member.role}
                  disabled={roleBusy}
                  onChange={(event) => onChangeRole(member, event.target.value)}
                >
                  {member.changeRoles.map((option) => (
                    <option key={option} value={option}>
                      {roleLabel(option)}
                    </option>
                  ))}
                </Select>
              </label>
            ) : (
              <Badge variant={roleBadgeVariant(member.role)}>
                {roleLabel(member.role)}
              </Badge>
            )}
            {member.hasLinkedStudent && member.role !== "parent" ? (
              <Badge variant="neutral">Parent</Badge>
            ) : null}
            {member.hasStudentAccount && member.role !== "student" ? (
              <Badge variant="neutral">Student</Badge>
            ) : null}
          </div>
        );

        if (accessMember == null) {
          return (
            <li
              key={member.membershipId}
              className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:gap-3 sm:py-3"
            >
              <div className="min-w-0 sm:flex-1">{rowBody}</div>
              {trailing}
            </li>
          );
        }

        const accessModel = orgMemberAccessModelFromPeopleRow(
          orgSlug,
          accessMember,
          {
            onSuspend,
            onReactivate,
            onRemoveFromOrg,
          },
          { staff: member, onRemoveAsCollaborator },
        );

        return (
          <OrgMemberAccessActions
            key={member.membershipId}
            {...accessModel}
            busy={accessBusy}
          >
            {({ contextMenuProps, trigger }) => (
              <li className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:gap-3 sm:py-3">
                <div {...contextMenuProps} className="min-w-0 sm:flex-1">
                  {rowBody}
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  {trailing}
                  {trigger}
                </div>
              </li>
            )}
          </OrgMemberAccessActions>
        );
      })}
    </ul>
  );
}
