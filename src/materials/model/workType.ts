export const MATERIAL_WORK_TYPES = ["material", "assignment"] as const;
export type MaterialWorkType = (typeof MATERIAL_WORK_TYPES)[number];

export function parseMaterialWorkType(value: string): MaterialWorkType | null {
  return MATERIAL_WORK_TYPES.includes(value as MaterialWorkType)
    ? (value as MaterialWorkType)
    : null;
}

export function materialWorkTypeLabel(workType: MaterialWorkType): string {
  if (workType === "assignment") return "Assignment";
  return "Material";
}

export function materialWorkTypeAllowsDueDate(workType: MaterialWorkType): boolean {
  return workType === "assignment";
}

export function materialWorkTypeAllowsSubmissions(workType: MaterialWorkType): boolean {
  return workType === "assignment";
}
