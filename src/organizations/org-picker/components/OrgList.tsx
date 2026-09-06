import { Link } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import type { OrgMembership } from "@/organizations/databridge/memberships";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";

export function OrgList({ memberships }: { memberships: OrgMembership[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {memberships.map((membership) => (
        <li key={membership.membershipId}>
          <OrgCard membership={membership} />
        </li>
      ))}
    </ul>
  );
}

function OrgCard({ membership }: { membership: OrgMembership }) {
  const { organization, role } = membership;
  return (
    <Link
      to={`/my/${organization.slug}`}
      className="flex items-center gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--green)] hover:bg-[var(--green-tint)] motion-reduce:transition-none"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15.5px] font-extrabold text-[var(--ink)]">
          {organization.name}
        </p>
        <p className="truncate text-[12.5px] text-[var(--ink-faint)]">
          /my/{organization.slug}
        </p>
      </div>
      <Badge variant={roleBadgeVariant(role)}>{roleLabel(role)}</Badge>
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-[var(--ink-faint)]" aria-hidden />
    </Link>
  );
}
