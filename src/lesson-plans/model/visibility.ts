import { isPublished, type MaterialVisibility } from "@/materials/model/visibility";

export type LessonPlanVisibility = MaterialVisibility;

export function parseLessonPlanVisibility(value: string): LessonPlanVisibility {
  return value === "published" ? "published" : "unpublished";
}

export function lessonPlanIsPublished(visibility: LessonPlanVisibility): boolean {
  return isPublished(visibility);
}
