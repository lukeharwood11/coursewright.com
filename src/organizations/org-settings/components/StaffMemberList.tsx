import { Badge } from "@/ui/Badge";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import type { OrgStaffMember } from "@/organizations/databridge/staffInvites";

export function StaffMemberList({ members }: { members: OrgStaffMember[] }) {
  if (members.length === 0) {
    return (
      <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
        No owners, admins, or instructors yet.
      </p>
    );
  }

  return (
    <ul className="mt-3 divide-y divide-[var(--line-soft)]">
      {members.map((member) => (
        <li key={member.membershipId} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-extrabold text-[var(--ink)]">
              {member.name || member.email}
            </p>
            {member.name ? (
              <p className="truncate text-[12.5px] text-[var(--ink-faint)]">{member.email}</p>
            ) : null}
          </div>
          <Badge variant={roleBadgeVariant(member.role)}>{roleLabel(member.role)}</Badge>
        </li>
      ))}
    </ul>
  );
}
