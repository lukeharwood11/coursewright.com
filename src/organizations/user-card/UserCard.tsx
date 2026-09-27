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
  email,
  isYou = false,
  role,
  trailing,
  compact = false,
  fit = false,
}: {
  orgSlug: string;
  orgProfileId?: number | null;
  userId?: string | null;
  name: string;
  /** Shown under the name when both are present (inside the profile link). */
  email?: string | null;
  isYou?: boolean;
  role?: string | null;
  trailing?: ReactNode;
  compact?: boolean;
  /** Size to the person instead of stretching across the row. */
  fit?: boolean;
}) {
  const parsedRole = role ? parseOrgRole(role) : null;
  const avatarSize = compact ? 28 : 32;
  const href = orgVisibleProfilePath(orgSlug, { orgProfileId, userId });
  const displayName = name.trim() || email?.trim() || name;
  const showEmail = Boolean(
    name.trim() && email?.trim() && name.trim() !== email.trim(),
  );
  const stacked = showEmail || isYou;

  const person = (
    <>
      <Avatar name={displayName} size={avatarSize} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`min-w-0 truncate font-semibold text-[var(--ink)] ${
              compact ? "text-[13.5px]" : "text-[14px] font-extrabold"
            }`}
          >
            {displayName}
          </span>
          {parsedRole ? (
            <Badge variant={roleBadgeVariant(parsedRole)}>
              {roleLabel(parsedRole)}
            </Badge>
          ) : null}
        </div>
        {showEmail ? (
          <p className="truncate text-[12.5px] text-[var(--ink-faint)]">{email}</p>
        ) : null}
        {isYou ? (
          <p className="text-[12.5px] font-bold text-[var(--ink-faint)]">You</p>
        ) : null}
      </div>
    </>
  );

  const personClassName = `flex min-w-0 gap-2 rounded-[8px] px-1 py-1 ${
    stacked ? "items-start" : "items-center"
  } ${fit ? "" : "flex-1"}`;

  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${fit ? "w-fit max-w-full" : ""}`}
    >
      {href ? (
        <Link
          to={href}
          className={`${personClassName} hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]`}
        >
          {person}
        </Link>
      ) : (
        <div className={personClassName}>{person}</div>
      )}
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
