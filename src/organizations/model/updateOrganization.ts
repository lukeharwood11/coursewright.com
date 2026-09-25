import { K12_GRADE_LABELS } from "./createDefaults";
import { parseGradeLabels, parseGradeScheme } from "./gradeScheme";
import { parseOrgType, type OrgType } from "./orgType";
import {
  parseOrgProfile,
  parseWebsite,
  sameOptionalText,
  trimToNull,
  type OrgProfileFields,
} from "./orgProfile";
import {
  normalizeSchoolDays,
  sameSchoolDays,
  type SchoolDay,
} from "./schoolDays";
import { isReservedSlug, isValidSlug, slugify } from "./slug";

export type UpdateOrganizationInput = {
  name: string;
  slug: string;
  orgType: string;
  gradeScheme: string;
  gradeLabels: string[];
  schoolDays: number[];
  about: string;
  address: string;
  website: string;
  contactEmail: string;
  phone: string;
  currentSlug: string;
  confirmPermalinkChange: boolean;
};

export type ValidatedUpdateOrganization = {
  name: string;
  slug: string;
  orgType: OrgType;
  gradeScheme: "none" | "k12" | "custom";
  gradeLabels: string[];
  schoolDays: SchoolDay[];
  about: string | null;
  address: string | null;
  website: string | null;
  contactEmail: string | null;
  phone: string | null;
  slugChanged: boolean;
};

export function validateUpdateOrganization(
  input: UpdateOrganizationInput,
): { ok: true; value: ValidatedUpdateOrganization } | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Name is required." };
  }

  const slug = slugify(input.slug.trim() || name);
  if (!isValidSlug(slug)) {
    return {
      ok: false,
      error: "Web address must be 2–60 letters, numbers, or hyphens.",
    };
  }
  if (isReservedSlug(slug)) {
    return { ok: false, error: "That web address is reserved. Try another." };
  }

  const slugChanged = slug !== input.currentSlug;
  if (slugChanged && !input.confirmPermalinkChange) {
    return {
      ok: false,
      error: "Confirm that you understand changing the web address breaks existing links.",
    };
  }

  const orgType = parseOrgType(input.orgType);
  if (!orgType) {
    return { ok: false, error: "Choose an organization type." };
  }

  const gradeScheme = parseGradeScheme(input.gradeScheme);
  if (!gradeScheme) {
    return { ok: false, error: "Choose how grades are named." };
  }

  const gradeLabels =
    gradeScheme === "none"
      ? []
      : gradeScheme === "k12"
        ? [...K12_GRADE_LABELS]
        : input.gradeLabels.map((label) => label.trim()).filter(Boolean);

  if (gradeScheme !== "none" && gradeLabels.length < 1) {
    return { ok: false, error: "Add at least one grade label." };
  }

  const schoolDays = normalizeSchoolDays(input.schoolDays);
  if (schoolDays.length < 1) {
    return { ok: false, error: "Choose at least one school day." };
  }

  const profile = parseOrgProfile({
    about: input.about,
    address: input.address,
    website: input.website,
    contactEmail: input.contactEmail,
    phone: input.phone,
  });
  if (!profile.ok) return profile;

  return {
    ok: true,
    value: {
      name,
      slug,
      orgType,
      gradeScheme,
      gradeLabels,
      schoolDays,
      ...profile.value,
      slugChanged,
    },
  };
}

export type OrgSettingsDraft = {
  name: string;
  slug: string;
  orgType: string;
  gradeScheme: string;
  gradeLabelsText: string;
  schoolDays: SchoolDay[];
  about: string;
  address: string;
  website: string;
  contactEmail: string;
  phone: string;
};

export type OrgSettingsSaved = {
  name: string;
  slug: string;
  orgType: string;
  gradeScheme: string;
  gradeLabels: string[];
  schoolDays: SchoolDay[];
} & OrgProfileFields;

function sameLabels(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((label, index) => label === right[index]);
}

function sameWebsite(draft: string, saved: string | null): boolean {
  const parsed = parseWebsite(draft);
  if (!parsed.ok) return trimToNull(draft) === saved;
  return parsed.value === saved;
}

/** True when organization identity / type / school days / grade scheme differ. */
export function orgIdentityHaveChanges(
  draft: OrgSettingsDraft,
  saved: OrgSettingsSaved,
): boolean {
  if (draft.name.trim() !== saved.name) return true;
  if (draft.slug !== saved.slug) return true;
  if (draft.orgType !== saved.orgType) return true;
  if (draft.gradeScheme !== saved.gradeScheme) return true;
  if (!sameSchoolDays(draft.schoolDays, saved.schoolDays)) return true;
  if (draft.gradeScheme === "custom") {
    return !sameLabels(parseGradeLabels(draft.gradeLabelsText), saved.gradeLabels);
  }
  return false;
}

/** True when optional profile fields differ. */
export function orgProfileHaveChanges(
  draft: OrgSettingsDraft,
  saved: OrgSettingsSaved,
): boolean {
  if (!sameOptionalText(draft.about, saved.about)) return true;
  if (!sameOptionalText(draft.address, saved.address)) return true;
  if (!sameWebsite(draft.website, saved.website)) return true;
  if (!sameOptionalText(draft.contactEmail.toLowerCase(), saved.contactEmail)) return true;
  if (!sameOptionalText(draft.phone, saved.phone)) return true;
  return false;
}

/** True when the draft would persist a different identity, type, profile, school days, or grade scheme. */
export function orgSettingsHaveChanges(
  draft: OrgSettingsDraft,
  saved: OrgSettingsSaved,
): boolean {
  return orgIdentityHaveChanges(draft, saved) || orgProfileHaveChanges(draft, saved);
}

export function organizationWriteErrorMessage(
  error: { code?: string; message: string },
  kind: "create" | "update",
): string {
  if (error.code === "23505") {
    return "That web address is taken. Try another.";
  }
  if (
    error.code === "42501" ||
    error.message.toLowerCase().includes("row-level security")
  ) {
    return kind === "update"
      ? "You don’t have permission to change this organization."
      : "Couldn’t create the organization. Sign out, sign back in, and try again.";
  }
  return error.message;
}
