import type { ReactNode } from "react";
import { BuildingOffice2Icon, PencilSquareIcon } from "@heroicons/react/24/outline";
import type { OrganizationSummary } from "@/organizations/databridge/memberships";
import {
  phoneHref,
  websiteDisplay,
} from "@/organizations/model/orgProfile";
import { orgTypeLabel } from "@/organizations/model/orgType";
import { homeDaysLabel } from "@/organizations/model/homeDays";
import { schoolDaysLabel } from "@/organizations/model/schoolDays";
import { ButtonLink } from "@/ui/Button";

type OrgProfileContentProps = {
  organization: OrganizationSummary;
  isOwner: boolean;
};

function ProfileField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-[12px] font-bold text-[var(--ink-faint)]">{label}</dt>
      <dd className="mt-1 text-[14.5px] leading-relaxed text-[var(--ink)]">
        {children}
      </dd>
    </div>
  );
}

export function OrgProfileContent({
  organization,
  isOwner,
}: OrgProfileContentProps) {
  const orgSlug = organization.slug;

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--r-sm)] bg-[var(--green-tint)] text-[var(--green-deep)]"
            aria-hidden
          >
            {organization.iconUrl ? (
              <img
                src={organization.iconUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <BuildingOffice2Icon className="h-7 w-7" />
            )}
          </span>
          <div className="min-w-0">
            <h1
              className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {organization.name}
            </h1>
            <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
              /my/{orgSlug}
            </p>
          </div>
        </div>
        {isOwner ? (
          <ButtonLink variant="secondary" to={`/my/${orgSlug}/settings`}>
            <PencilSquareIcon className="h-5 w-5" aria-hidden />
            Edit organization
          </ButtonLink>
        ) : null}
      </div>

      <dl className="mt-8 flex flex-col gap-5">
        <ProfileField label="Organization type">
          {orgTypeLabel(organization.orgType)}
        </ProfileField>
        <ProfileField label="School days">
          {schoolDaysLabel(organization.schoolDays)}
        </ProfileField>
        {organization.homeDays.length > 0 ? (
          <ProfileField label="Home days">
            {homeDaysLabel(organization.homeDays)}
          </ProfileField>
        ) : null}
        {organization.about ? (
          <ProfileField label="About">
            <p className="whitespace-pre-wrap">{organization.about}</p>
          </ProfileField>
        ) : null}
        {organization.address ? (
          <ProfileField label="Location">{organization.address}</ProfileField>
        ) : null}
        {organization.website ? (
          <ProfileField label="Website">
            <a
              href={organization.website}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              {websiteDisplay(organization.website)}
            </a>
          </ProfileField>
        ) : null}
        {organization.contactEmail ? (
          <ProfileField label="Contact email">
            <a
              href={`mailto:${organization.contactEmail}`}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              {organization.contactEmail}
            </a>
          </ProfileField>
        ) : null}
        {organization.phone ? (
          <ProfileField label="Phone">
            <a
              href={phoneHref(organization.phone)}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              {organization.phone}
            </a>
          </ProfileField>
        ) : null}
      </dl>
    </div>
  );
}
