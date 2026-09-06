import { CREATE_ORG_DEFAULTS } from "@/organizations/model/createDefaults";
import { createOrganizationErrorMessage } from "@/organizations/model/createOrganization";
import type { ValidatedCreateOrganization } from "@/organizations/model/createOrganization";
import { parseGradeScheme } from "@/organizations/model/gradeScheme";
import type { GradeScheme } from "@/organizations/model/gradeScheme";
import { parseOrgType } from "@/organizations/model/orgType";
import type { OrgType } from "@/organizations/model/orgType";
import {
  organizationWriteErrorMessage,
  type ValidatedUpdateOrganization,
} from "@/organizations/model/updateOrganization";
import { requireSupabase } from "./client";
import type { OrganizationSummary } from "./memberships";

export type OrganizationDetails = {
  id: string;
  name: string;
  slug: string;
  orgType: OrgType;
  gradeScheme: GradeScheme;
  gradeLabels: string[];
};

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  grade_scheme: string;
  grade_labels: string[];
};

function toOrganizationDetails(row: OrganizationRow): OrganizationDetails | null {
  const orgType = parseOrgType(row.org_type);
  const gradeScheme = parseGradeScheme(row.grade_scheme);
  if (!orgType || !gradeScheme) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
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
  });

  if (insertError) {
    throw new Error(createOrganizationErrorMessage(insertError));
  }

  const { data, error: fetchError } = await db
    .from("organizations")
    .select("id, name, slug")
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
  return data;
}

export async function getOrganization(
  id: string,
): Promise<OrganizationDetails | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("organizations")
    .select("id, name, slug, org_type, grade_scheme, grade_labels")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toOrganizationDetails(data as OrganizationRow);
}

export async function updateOrganization(
  id: string,
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
    })
    .eq("id", id)
    .select("id, name, slug, org_type, grade_scheme, grade_labels")
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
