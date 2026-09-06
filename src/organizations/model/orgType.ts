export const ORG_TYPES = ["coop", "micro_school"] as const;
export type OrgType = (typeof ORG_TYPES)[number];

export function parseOrgType(value: string): OrgType | null {
  if (value === "coop" || value === "micro_school") return value;
  return null;
}

export function orgTypeLabel(type: OrgType): string {
  return type === "coop" ? "Co-op" : "Micro-school";
}
