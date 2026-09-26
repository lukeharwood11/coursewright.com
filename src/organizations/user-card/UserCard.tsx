import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";
import { orgVisibleProfilePath } from "@/organizations/model/paths";
import {
  parseOrgRole,
  roleBadgeVariant,
  roleLabel,
} from "@/organizations/model/role";

export function UserCard({
  orgSlug,
  orgProfileId,
  userId,
  name,
  role,
  trailing,
  compact = false,
  fit = false,
}: {
  orgSlug: string;
  orgProfileId?: number | null;
  userId?: string | null;
  name: string;
  role?: string | null;
  trailing?: ReactNode;
  compact?: boolean;
  /** Size to the person instead of stretching across the row. */
  fit?: boolean;
}) {
  const parsedRole = role ? parseOrgRole(role) : null;
  const avatarSize = compact ? 28 : 32;
  const href = orgVisibleProfilePath(orgSlug, { orgProfileId, userId });

  const person = (
    <>
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
    </>
  );

  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${fit ? "w-fit max-w-full" : ""}`}
    >
      {href ? (
        <Link
          to={href}
          className={`flex min-w-0 items-center gap-2 rounded-[8px] px-1 py-1 hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] ${
            fit ? "" : "flex-1"
          }`}
        >
          {person}
        </Link>
      ) : (
        <div
          className={`flex min-w-0 items-center gap-2 rounded-[8px] px-1 py-1 ${
            fit ? "" : "flex-1"
          }`}
        >
          {person}
        </div>
      )}
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
