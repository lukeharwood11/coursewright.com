import { organizationWriteErrorMessage } from "./updateOrganization";
import { isReservedSlug, isValidSlug, slugify } from "./slug";

export type CreateOrganizationInput = {
  name: string;
  slug: string;
};

export type ValidatedCreateOrganization = {
  name: string;
  slug: string;
};

export function validateCreateOrganization(
  input: CreateOrganizationInput,
): { ok: true; value: ValidatedCreateOrganization } | { ok: false; error: string } {
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

  return { ok: true, value: { name, slug } };
}

export function createOrganizationErrorMessage(error: { code?: string; message: string }): string {
  return organizationWriteErrorMessage(error, "create");
}
