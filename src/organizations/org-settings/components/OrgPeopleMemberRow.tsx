import { UserCard } from "@/organizations/user-card/UserCard";
import { Badge } from "@/ui/Badge";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import type { OrgPeopleMemberRow as OrgPeopleMemberRowType } from "../hooks/useOrgPeople";
import type { StaffMemberRow } from "../hooks/useOrgStaff";
import {
  OrgMemberAccessActions,
  orgMemberAccessModelFromPeopleRow,
} from "./OrgMemberAccessActions";

export function OrgPeopleMemberRow({
  orgSlug,
  member,
  staffMember,
  busy,
  onSuspend,
  onReactivate,
  onRemoveFromOrg,
  onRemoveAsCollaborator,
}: {
  orgSlug: string;
  member: OrgPeopleMemberRowType;
  staffMember?: StaffMemberRow | null;
  busy: boolean;
  onSuspend: (member: OrgPeopleMemberRowType) => void;
  onReactivate: (member: OrgPeopleMemberRowType) => void;
  onRemoveFromOrg: (member: OrgPeopleMemberRowType) => void;
  onRemoveAsCollaborator?: (staff: StaffMemberRow) => void;
}) {
  const accessModel = orgMemberAccessModelFromPeopleRow(
    orgSlug,
    member,
    {
      onSuspend,
      onReactivate,
      onRemoveFromOrg,
    },
    { staff: staffMember, onRemoveAsCollaborator },
  );

  return (
    <OrgMemberAccessActions {...accessModel} busy={busy}>
      {({ contextMenuProps, trigger }) => (
        <li className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:gap-3 sm:py-3">
          <div {...contextMenuProps} className="min-w-0 sm:flex-1">
            <UserCard
              orgSlug={orgSlug}
              orgProfileId={member.orgProfileId}
              userId={member.userId}
              name={member.name || member.email}
              email={member.email}
              isYou={member.isYou}
            />
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={roleBadgeVariant(member.role)}>
                {roleLabel(member.role)}
              </Badge>
              {member.isParent && member.role !== "parent" ? (
                <Badge variant="neutral">Parent</Badge>
              ) : null}
              {member.isStudent && member.role !== "student" ? (
                <Badge variant="neutral">Student</Badge>
              ) : null}
              {member.status === "suspended" ? (
                <Badge variant="neutral">Suspended</Badge>
              ) : null}
            </div>
            {trigger}
          </div>
        </li>
      )}
    </OrgMemberAccessActions>
  );
}
