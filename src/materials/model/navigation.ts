import { coursePath } from "@/courses/model/paths";
import { unitPath } from "@/units/model/paths";

/** Router location state when opening a material from the unit detail page. */
export type MaterialLocationState = {
  fromUnit?: true;
};

export function materialLocationState(
  fromUnitPage: boolean,
): MaterialLocationState | undefined {
  return fromUnitPage ? { fromUnit: true } : undefined;
}

export function materialOpenedFromUnit(state: unknown): boolean {
  return (
    typeof state === "object" &&
    state !== null &&
    (state as MaterialLocationState).fromUnit === true
  );
}

export function materialBackDestination(args: {
  fromUnit: boolean;
  orgSlug: string;
  courseId: number;
  courseTitle: string;
  unit: { id: number; title: string } | null | undefined;
}): { to: string; label: string } {
  if (args.fromUnit && args.unit) {
    return {
      to: unitPath(args.orgSlug, args.courseId, args.unit.id),
      label: `Back to ${args.unit.title}`,
    };
  }
  return {
    to: coursePath(args.orgSlug, args.courseId),
    label: `Back to ${args.courseTitle}`,
  };
}
