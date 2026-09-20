import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";
import { userProfilePath } from "@/organizations/model/paths";
import {
  parseOrgRole,
  roleBadgeVariant,
  roleLabel,
} from "@/organizations/model/role";

export function UserCard({
  orgSlug,
  userId,
  name,
  role,
  trailing,
  compact = false,
}: {
  orgSlug: string;
  userId: string;
  name: string;
  role?: string | null;
  trailing?: ReactNode;
  compact?: boolean;
}) {
  const parsedRole = role ? parseOrgRole(role) : null;
  const avatarSize = compact ? 28 : 32;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Link
        to={userProfilePath(orgSlug, userId)}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-[8px] px-1 py-1 hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
      >
        <Avatar name={name} size={avatarSize} />
        <span
          className={`min-w-0 truncate font-semibold text-[var(--ink)] ${
            compact ? "text-[13.5px]" : "text-[14px] font-extrabold"
          }`}
        >
          {name}
        </span>
        {parsedRole ? (
          <Badge variant={roleBadgeVariant(parsedRole)}>{roleLabel(parsedRole)}</Badge>
        ) : null}
      </Link>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
