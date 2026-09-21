import { Link } from "react-router-dom";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";
import { coursePath } from "@/courses/model/paths";
import type { OrgPersonProfile } from "@/organizations/databridge/people";
import type { OrgRole } from "@/organizations/model/role";
import { isStaffRole, roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import { ProfileLinkList } from "./ProfileLinkList";

export function UserProfileContent({
  profile,
  orgSlug,
  role,
  compact = false,
  headingId,
}: {
  profile: OrgPersonProfile;
  orgSlug: string;
  role: OrgRole | null;
  /** Tighter spacing for modal presentation. */
  compact?: boolean;
  headingId?: string;
}) {
  const staff = role != null && isStaffRole(role);
  const avatarSize = compact ? 48 : 56;
  const titleClass = compact
    ? "text-[20px] font-semibold text-[var(--ink)]"
    : "text-[24px] font-semibold text-[var(--ink)] md:text-[26px]";
  const HeadingTag = compact ? "h2" : "h1";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={profile.name} size={avatarSize} />
        <div>
          <HeadingTag
            id={headingId}
            className={titleClass}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {profile.name}
          </HeadingTag>
          <div className="mt-2">
            <Badge variant={roleBadgeVariant(profile.role)}>
              {roleLabel(profile.role)}
            </Badge>
          </div>
        </div>
      </div>

      <ProfileLinkList
        heading="Teaches"
        empty="Not listed as a teacher on a course."
        items={profile.teaches}
        hrefFor={(item) => coursePath(orgSlug, item.id)}
        compact={compact}
      />
      <ProfileLinkList
        heading="Leads"
        empty="Not a lead on a class."
        items={profile.leads}
        hrefFor={staff ? (item) => `/my/${orgSlug}/classes/${item.id}` : undefined}
        compact={compact}
      />
      <ProfileLinkList
        heading="Courses"
        empty="Not on a course through a linked student."
        items={profile.courses}
        hrefFor={(item) => coursePath(orgSlug, item.id)}
        compact={compact}
      />
    </div>
  );
}

export function UserProfileNotFound({
  orgSlug,
  orgName,
  error,
  showBackLink = true,
}: {
  orgSlug: string;
  orgName: string;
  error?: string | null;
  showBackLink?: boolean;
}) {
  return (
    <div>
      <h1
        className="text-[24px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        We couldn’t find that person
      </h1>
      <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
        They may not be in this organization, or you may not have access.
      </p>
      {error ? (
        <p className="mt-2 text-[13px] text-[var(--amber-deep)]">{error}</p>
      ) : null}
      {showBackLink ? (
        <p className="mt-4 text-[13px]">
          <Link
            to={`/my/${orgSlug}`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to {orgName}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
