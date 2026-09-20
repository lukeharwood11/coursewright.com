import type { LessonPlanDetail } from "@/lesson-plans/databridge/lessonPlans";
import { lessonPlanIsPublished } from "@/lesson-plans/model/visibility";
import { isPublished } from "@/materials/model/visibility";
import type { CalendarSourceMaterial } from "@/calendar/databridge/calendar";
import {
  chipsForMaterials,
  type CalendarLessonPlanDay,
  type CalendarMaterialChip,
  type CalendarWeekNote,
} from "./events";

export function lessonPlansToWeekNotes(plans: LessonPlanDetail[]): CalendarWeekNote[] {
  return plans.map((plan) => ({
    planId: plan.id,
    courseId: plan.courseId,
    courseTitle: plan.courseTitle,
    colorKey: plan.colorKey,
    title: plan.title,
    weekNote: plan.weekNote,
    unpublished: !lessonPlanIsPublished(plan.visibility),
  }));
}

export function lessonPlansToDays(plans: LessonPlanDetail[]): CalendarLessonPlanDay[] {
  return plans.flatMap((plan) =>
    plan.days.map((day) => ({
      planId: plan.id,
      courseId: plan.courseId,
      courseTitle: plan.courseTitle,
      colorKey: plan.colorKey,
      date: day.date,
      body: day.body,
      unpublished: !lessonPlanIsPublished(plan.visibility),
      materials: day.materials
        .filter((material) => isPublished(material.visibility) || !lessonPlanIsPublished(plan.visibility))
        .map((material) => ({
          id: material.id,
          title: material.title,
          unitId: material.unitId,
          assigned: false,
          due: false,
        })),
    })),
  );
}

export function materialsToChips(materials: CalendarSourceMaterial[]): CalendarMaterialChip[] {
  return chipsForMaterials(materials);
}

export function plansForWeek(
  plans: LessonPlanDetail[],
  weekStart: string,
): LessonPlanDetail[] {
  return plans.filter((plan) => plan.weekStart === weekStart);
}
