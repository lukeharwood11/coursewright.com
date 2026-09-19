import type { CourseColorKey } from "@/courses/model/courseColor";

export type CalendarChipKind = "assigned" | "due";

export type CalendarMaterialChip = {
  materialId: number;
  title: string;
  courseId: number;
  courseTitle: string;
  colorKey: CourseColorKey;
  date: string;
  kind: CalendarChipKind;
  unitId: number | null;
  unpublished: boolean;
};

export type CalendarLessonPlanDay = {
  planId: number;
  courseId: number;
  courseTitle: string;
  colorKey: CourseColorKey;
  date: string;
  body: string;
  unpublished: boolean;
  materials: Array<{
    id: number;
    title: string;
    unitId: number | null;
    assigned: boolean;
    due: boolean;
  }>;
};

export type CalendarWeekNote = {
  planId: number;
  courseId: number;
  courseTitle: string;
  colorKey: CourseColorKey;
  title: string;
  weekNote: string;
  unpublished: boolean;
};

export type CalendarCourse = {
  id: number;
  title: string;
  colorKey: CourseColorKey;
};

export type CalendarDayCell = {
  date: string;
  inMonth: boolean;
  lessonDays: CalendarLessonPlanDay[];
  chips: CalendarMaterialChip[];
};

export function filterCourses<T extends { courseId: number }>(
  items: T[],
  hiddenCourseIds: Set<number>,
): T[] {
  if (hiddenCourseIds.size === 0) return items;
  return items.filter((item) => !hiddenCourseIds.has(item.courseId));
}

export function toggleHiddenCourse(hidden: number[], courseId: number): number[] {
  return hidden.includes(courseId)
    ? hidden.filter((id) => id !== courseId)
    : [...hidden, courseId];
}

export function assignedDateForChip(
  scheduledDate: string | null,
  unitStart: string | null,
  unitEnd: string | null,
): string | null {
  if (scheduledDate) return scheduledDate;
  if (unitStart && unitEnd) return unitStart;
  return null;
}

export function chipsForMaterials(
  materials: Array<{
    id: number;
    title: string;
    courseId: number;
    courseTitle: string;
    colorKey: CourseColorKey;
    scheduledDate: string | null;
    dueDate: string | null;
    unitId: number | null;
    unitStart: string | null;
    unitEnd: string | null;
    unpublished: boolean;
  }>,
): CalendarMaterialChip[] {
  const chips: CalendarMaterialChip[] = [];
  for (const material of materials) {
    const assigned = assignedDateForChip(
      material.scheduledDate,
      material.unitStart,
      material.unitEnd,
    );
    if (assigned) {
      chips.push({
        materialId: material.id,
        title: material.title,
        courseId: material.courseId,
        courseTitle: material.courseTitle,
        colorKey: material.colorKey,
        date: assigned,
        kind: "assigned",
        unitId: material.unitId,
        unpublished: material.unpublished,
      });
    }
    if (material.dueDate) {
      chips.push({
        materialId: material.id,
        title: material.title,
        courseId: material.courseId,
        courseTitle: material.courseTitle,
        colorKey: material.colorKey,
        date: material.dueDate,
        kind: "due",
        unitId: material.unitId,
        unpublished: material.unpublished,
      });
    }
  }
  return chips;
}

export function mergeDayMaterials(
  planMaterials: Array<{ id: number; title: string; unitId: number | null }>,
  chips: CalendarMaterialChip[],
  courseId: number,
  date: string,
): CalendarLessonPlanDay["materials"] {
  const assigned = new Set(
    chips
      .filter((chip) => chip.courseId === courseId && chip.date === date && chip.kind === "assigned")
      .map((chip) => chip.materialId),
  );
  const due = new Set(
    chips
      .filter((chip) => chip.courseId === courseId && chip.date === date && chip.kind === "due")
      .map((chip) => chip.materialId),
  );
  const seen = new Set<number>();
  const merged: CalendarLessonPlanDay["materials"] = [];
  for (const material of planMaterials) {
    seen.add(material.id);
    merged.push({
      id: material.id,
      title: material.title,
      unitId: material.unitId,
      assigned: assigned.has(material.id),
      due: due.has(material.id),
    });
  }
  for (const chip of chips) {
    if (chip.courseId !== courseId || chip.date !== date) continue;
    if (seen.has(chip.materialId)) continue;
    seen.add(chip.materialId);
    merged.push({
      id: chip.materialId,
      title: chip.title,
      unitId: chip.unitId,
      assigned: assigned.has(chip.materialId),
      due: due.has(chip.materialId),
    });
  }
  return merged;
}

export function leftoverChips(
  chips: CalendarMaterialChip[],
  lessonDays: CalendarLessonPlanDay[],
  date: string,
): CalendarMaterialChip[] {
  const covered = new Set(
    lessonDays.flatMap((day) =>
      day.date === date ? day.materials.map((material) => `${day.courseId}:${material.id}`) : [],
    ),
  );
  return chips.filter((chip) => {
    if (chip.date !== date) return false;
    return !covered.has(`${chip.courseId}:${chip.materialId}`);
  });
}

/** A day belongs on This week when it has plan text, attached materials, or assigned/due chips. */
export function dayHasCalendarContent(
  date: string,
  lessonDays: CalendarLessonPlanDay[],
  chips: CalendarMaterialChip[],
): boolean {
  for (const day of lessonDays) {
    if (day.date !== date) continue;
    if (day.body.trim()) return true;
    if (day.materials.length > 0) return true;
  }
  return chips.some((chip) => chip.date === date);
}

export function weekDatesToShow(
  dates: string[],
  lessonDays: CalendarLessonPlanDay[],
  chips: CalendarMaterialChip[],
  omitEmpty: boolean,
): string[] {
  if (!omitEmpty) return dates;
  return dates.filter((date) => dayHasCalendarContent(date, lessonDays, chips));
}
