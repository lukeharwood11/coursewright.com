export const ORG_TYPES = ["coop", "micro_school", "family"] as const;
export type OrgType = (typeof ORG_TYPES)[number];

export function parseOrgType(value: string): OrgType | null {
  if (value === "coop" || value === "micro_school" || value === "family") {
    return value;
  }
  return null;
}

export function orgTypeLabel(type: OrgType): string {
  switch (type) {
    case "coop":
      return "Co-op";
    case "micro_school":
      return "School";
    case "family":
      return "Family";
  }
}

/** Short helper under the organization-type control. */
export function orgTypeHint(type: OrgType): string | null {
  if (type === "family") {
    return "For parents making materials at home.";
  }
  return null;
}
