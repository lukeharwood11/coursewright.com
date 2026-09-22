import {
  orgHasProfile,
  phoneHref,
  websiteDisplay,
  type OrgProfileFields,
} from "@/organizations/model/orgProfile";

export function OrgAboutCard(profile: OrgProfileFields) {
  if (!orgHasProfile(profile)) return null;

  const links = [
    profile.address ? (
      <span key="address">{profile.address}</span>
    ) : null,
    profile.website ? (
      <a
        key="website"
        href={profile.website}
        target="_blank"
        rel="noreferrer"
        className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
      >
        {websiteDisplay(profile.website)}
      </a>
    ) : null,
    profile.contactEmail ? (
      <a
        key="email"
        href={`mailto:${profile.contactEmail}`}
        className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
      >
        {profile.contactEmail}
      </a>
    ) : null,
    profile.phone ? (
      <a
        key="phone"
        href={phoneHref(profile.phone)}
        className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
      >
        {profile.phone}
      </a>
    ) : null,
  ].filter(Boolean);

  return (
    <section
      className="mt-4 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3"
      aria-label="About this organization"
    >
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">
        About this organization
      </h2>
      {profile.about ? (
        <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--ink)]">
          {profile.about}
        </p>
      ) : null}
      {links.length > 0 ? (
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-[var(--ink-soft)]">
          {links}
        </p>
      ) : null}
    </section>
  );
}
