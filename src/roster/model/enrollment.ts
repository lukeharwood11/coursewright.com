export const ENROLLMENT_STATUSES = ["active", "completed", "withdrawn"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export function parseEnrollmentStatus(value: string): EnrollmentStatus | null {
  if (value === "active" || value === "completed" || value === "withdrawn") {
    return value;
  }
  return null;
}

export function enrollmentStatusLabel(status: EnrollmentStatus): string {
  if (status === "active") return "Active";
  if (status === "completed") return "Completed";
  return "Withdrawn";
}
