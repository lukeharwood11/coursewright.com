export const GRADE_SCHEMES = ["none", "k12", "custom"] as const;
export type GradeScheme = (typeof GRADE_SCHEMES)[number];

export function parseGradeScheme(value: string): GradeScheme | null {
  if (value === "none" || value === "k12" || value === "custom") return value;
  return null;
}

export function orgUsesGradeLevels(scheme: GradeScheme): boolean {
  return scheme !== "none";
}

export function parseGradeLabels(text: string): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const part of text.split(/[\n,]/)) {
    const label = part.trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels;
}

export function gradeLabelsToText(labels: string[]): string {
  return labels.join("\n");
}
