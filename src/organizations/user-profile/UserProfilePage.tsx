import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";
import { coursePath } from "@/courses/model/paths";
import { isStaffRole, roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import { ProfileLinkList } from "./components/ProfileLinkList";
import { useUserProfile } from "./hooks/useUserProfile";

export function UserProfilePage() {
  const page = useUserProfile();

  useEffect(() => {
    document.title = page.profile
      ? `${page.profile.name} · Course Wright`
      : "Profile · Course Wright";
  }, [page.profile]);

  if (page.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading profile…</p>
      </div>
    );
  }

  if (page.notFound || !page.profile) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that person
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          They may not be in this organization, or you may not have access.
        </p>
        {page.error ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]">{page.error}</p>
        ) : null}
        <p className="mt-4 text-[13px]">
          <Link
            to={`/my/${page.organization.slug}`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to {page.organization.name}
          </Link>
        </p>
      </div>
    );
  }

  const person = page.profile;
  const slug = page.organization.slug;
  const staff = isStaffRole(page.role);

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={person.name} size={56} />
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {person.name}
          </h1>
          <div className="mt-2">
            <Badge variant={roleBadgeVariant(person.role)}>
              {roleLabel(person.role)}
            </Badge>
          </div>
        </div>
      </div>

      <ProfileLinkList
        heading="Teaches"
        empty="Not listed as a teacher on a course."
        items={person.teaches}
        hrefFor={(item) => coursePath(slug, item.id)}
      />
      <ProfileLinkList
        heading="Leads"
        empty="Not a lead on a class."
        items={person.leads}
        hrefFor={staff ? (item) => `/my/${slug}/classes/${item.id}` : undefined}
      />
      <ProfileLinkList
        heading="Courses"
        empty="Not on a course through a linked student."
        items={person.courses}
        hrefFor={(item) => coursePath(slug, item.id)}
      />
    </div>
  );
}
