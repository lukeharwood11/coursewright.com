import { K12_GRADE_LABELS } from "./createDefaults";
import { parseGradeScheme } from "./gradeScheme";
import { parseOrgType } from "./orgType";
import { isReservedSlug, isValidSlug, slugify } from "./slug";

export type UpdateOrganizationInput = {
  name: string;
  slug: string;
  orgType: string;
  gradeScheme: string;
  gradeLabels: string[];
  currentSlug: string;
  confirmPermalinkChange: boolean;
};

export type ValidatedUpdateOrganization = {
  name: string;
  slug: string;
  orgType: "coop" | "micro_school";
  gradeScheme: "k12" | "custom";
  gradeLabels: string[];
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
      error: "Permalink must be 2–60 letters, numbers, or hyphens.",
    };
  }
  if (isReservedSlug(slug)) {
    return { ok: false, error: "That permalink is reserved. Try another." };
  }

  const slugChanged = slug !== input.currentSlug;
  if (slugChanged && !input.confirmPermalinkChange) {
    return {
      ok: false,
      error: "Confirm that you understand changing the permalink breaks existing links.",
    };
  }

  const orgType = parseOrgType(input.orgType);
  if (!orgType) {
    return { ok: false, error: "Choose co-op or micro-school." };
  }

  const gradeScheme = parseGradeScheme(input.gradeScheme);
  if (!gradeScheme) {
    return { ok: false, error: "Choose a grade scheme." };
  }

  const gradeLabels =
    gradeScheme === "k12" ? [...K12_GRADE_LABELS] : input.gradeLabels.map((label) => label.trim()).filter(Boolean);

  if (gradeLabels.length < 1) {
    return { ok: false, error: "Add at least one grade label." };
  }

  return {
    ok: true,
    value: { name, slug, orgType, gradeScheme, gradeLabels, slugChanged },
  };
}

export function organizationWriteErrorMessage(
  error: { code?: string; message: string },
  kind: "create" | "update",
): string {
  if (error.code === "23505") {
    return "That permalink is taken. Try another.";
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
