import { CREATE_ORG_DEFAULTS } from "@/organizations/model/createDefaults";
import { createOrganizationErrorMessage } from "@/organizations/model/createOrganization";
import type { ValidatedCreateOrganization } from "@/organizations/model/createOrganization";
import { parseGradeScheme } from "@/organizations/model/gradeScheme";
import type { GradeScheme } from "@/organizations/model/gradeScheme";
import { parseOrgTypeOrDefault } from "@/organizations/model/orgType";
import type { OrgType } from "@/organizations/model/orgType";
import {
  organizationWriteErrorMessage,
  type ValidatedUpdateOrganization,
} from "@/organizations/model/updateOrganization";
import { requireSupabase } from "./client";
import {
  ORG_SUMMARY_SELECT,
  toOrganizationSummary,
  type OrganizationSummary,
  type OrganizationSummaryRow,
} from "./memberships";
export { orgQueryKeys } from "./memberships";

export const ORG_DETAILS_SELECT =
  "id, name, slug, school_days, home_days, about, address, website, contact_email, phone, org_type, grade_scheme, grade_labels" as const;

export type OrganizationDetails = OrganizationSummary & {
  orgType: OrgType;
  gradeScheme: GradeScheme;
  gradeLabels: string[];
};

type OrganizationRow = OrganizationSummaryRow & {
  org_type: string;
  grade_scheme: string;
  grade_labels: string[];
};

function toOrganizationDetails(row: OrganizationRow): OrganizationDetails | null {
  const orgType = parseOrgTypeOrDefault(row.org_type);
  const gradeScheme = parseGradeScheme(row.grade_scheme);
  if (!gradeScheme) return null;
  return {
    ...toOrganizationSummary(row),
    orgType,
    gradeScheme,
    gradeLabels: row.grade_labels,
  };
}

export async function createOrganization(
  input: ValidatedCreateOrganization,
): Promise<OrganizationSummary> {
  const db = requireSupabase();

  // Do not `.select()` on insert. INSERT … RETURNING applies the SELECT RLS
  // policy before the after-insert trigger can add the creator as owner, so
  // PostgREST reports a policy violation on `organizations`.
  const { error: insertError } = await db.from("organizations").insert({
    name: input.name,
    slug: input.slug,
    org_type: CREATE_ORG_DEFAULTS.orgType,
    grade_scheme: CREATE_ORG_DEFAULTS.gradeScheme,
    grade_labels: CREATE_ORG_DEFAULTS.gradeLabels,
    school_days: CREATE_ORG_DEFAULTS.schoolDays,
    home_days: CREATE_ORG_DEFAULTS.homeDays,
  });

  if (insertError) {
    throw new Error(createOrganizationErrorMessage(insertError));
  }

  const { data, error: fetchError } = await db
    .from("organizations")
    .select(ORG_SUMMARY_SELECT)
    .eq("slug", input.slug)
    .maybeSingle();

  if (fetchError) {
    throw new Error(createOrganizationErrorMessage(fetchError));
  }
  if (!data) {
    throw new Error(
      "The organization was created but couldn’t be opened yet. Refresh and try again.",
    );
  }
  return toOrganizationSummary(data as OrganizationSummaryRow);
}

export async function getOrganization(
  id: number,
): Promise<OrganizationDetails | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("organizations")
    .select(ORG_DETAILS_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toOrganizationDetails(data as OrganizationRow);
}

export async function updateOrganization(
  id: number,
  input: ValidatedUpdateOrganization,
): Promise<OrganizationDetails> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("organizations")
    .update({
      name: input.name,
      slug: input.slug,
      org_type: input.orgType,
      grade_scheme: input.gradeScheme,
      grade_labels: input.gradeLabels,
      school_days: input.schoolDays,
      home_days: input.homeDays,
      about: input.about,
      address: input.address,
      website: input.website,
      contact_email: input.contactEmail,
      phone: input.phone,
    })
    .eq("id", id)
    .select(ORG_DETAILS_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(organizationWriteErrorMessage(error, "update"));
  }
  const organization = data ? toOrganizationDetails(data as OrganizationRow) : null;
  if (!organization) {
    throw new Error("You don’t have permission to change this organization.");
  }
  return organization;
}
