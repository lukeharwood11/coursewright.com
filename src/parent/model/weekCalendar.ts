import {
  chipsForMaterials,
  expandEventsInRange,
  type CalendarCourse,
  type CalendarEventChip,
  type CalendarLessonPlanDay,
  type CalendarMaterialChip,
  type CalendarWeekNote,
} from "@/calendar/model/events";
import type { ParentDashboard } from "./dashboard";

export type ParentWeekCalendar = {
  courses: CalendarCourse[];
  weekNotes: CalendarWeekNote[];
  lessonDays: CalendarLessonPlanDay[];
  chips: CalendarMaterialChip[];
  events: CalendarEventChip[];
};

export function parentWeekCalendar(dashboard: ParentDashboard): ParentWeekCalendar {
  const weekNotes: CalendarWeekNote[] = dashboard.lessonPlans
    .filter((plan) => plan.weekNote.trim().length > 0)
    .map((plan) => ({
      planId: plan.id,
      courseId: plan.courseId,
      courseTitle: plan.courseTitle,
      colorKey: plan.colorKey,
      title: plan.title,
      weekNote: plan.weekNote,
      unpublished: plan.unpublished,
    }));

  const lessonDays: CalendarLessonPlanDay[] = dashboard.lessonPlans.flatMap((plan) =>
    plan.days.map((day) => ({
      planId: plan.id,
      courseId: plan.courseId,
      courseTitle: plan.courseTitle,
      colorKey: plan.colorKey,
      date: day.date,
      body: day.body,
      unpublished: plan.unpublished,
      materials: day.materials.map((material) => ({
        id: material.id,
        title: material.title,
        unitId: material.unitId,
        assigned: false,
        due: false,
      })),
    })),
  );

  const seen = new Set<number>();
  const materials = dashboard.students.flatMap((student) =>
    student.courses.flatMap((course) =>
      course.materials.flatMap((material) => {
        if (seen.has(material.id)) return [];
        seen.add(material.id);
        return [
          {
            id: material.id,
            title: material.title,
            courseId: course.id,
            courseTitle: course.title,
            colorKey: course.colorKey,
            scheduledDate: material.assignedDate,
            dueDate: material.dueDate,
            unitId: material.unitId,
            unitStart: null,
            unitEnd: null,
            unpublished: false,
          },
        ];
      }),
    ),
  );

  return {
    courses: dashboard.courses,
    weekNotes,
    lessonDays,
    chips: chipsForMaterials(materials),
    events: expandEventsInRange(
      (dashboard.events ?? []).map((event) => ({
        id: event.id,
        title: event.title,
        location: event.location,
        startsOn: event.startsOn,
        endsOn: event.endsOn,
        startTime: event.startTime,
        endTime: event.endTime,
        audience: event.audience,
        courseIds: event.courseIds,
        colorKey: event.colorKey,
      })),
      dashboard.week.start,
      dashboard.week.end,
    ),
  };
}
