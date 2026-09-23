export const ORG_TYPES = ["other", "coop", "micro_school", "family"] as const;
export type OrgType = (typeof ORG_TYPES)[number];

export function parseOrgType(value: string): OrgType | null {
  if (
    value === "other" ||
    value === "coop" ||
    value === "micro_school" ||
    value === "family"
  ) {
    return value;
  }
  return null;
}

export function parseOrgTypeOrDefault(value: string | null | undefined): OrgType {
  return parseOrgType(value ?? "") ?? "other";
}

export function orgTypeLabel(type: OrgType): string {
  switch (type) {
    case "other":
      return "Other";
    case "coop":
      return "Co-op";
    case "micro_school":
      return "School";
    case "family":
      return "Family";
  }
}

/** Lowercase noun for “your …” in product copy (e.g. “When your school adds you”). */
export function orgTypeYourNoun(type: OrgType): string {
  switch (type) {
    case "other":
      return "organization";
    case "coop":
      return "co-op";
    case "micro_school":
      return "school";
    case "family":
      return "family";
  }
}

export function orgTypeAboutPlaceholder(type: OrgType): string {
  switch (type) {
    case "other":
      return "Who you are and how your organization works.";
    case "coop":
      return "Who you are and how this co-op works.";
    case "micro_school":
      return "Who you are and how this school works.";
    case "family":
      return "Who you are and how your family uses Course Wright.";
  }
}

/** Short helper under the organization-type control. */
export function orgTypeHint(type: OrgType): string | null {
  if (type === "family") {
    return "For households making materials at home.";
  }
  return null;
}
