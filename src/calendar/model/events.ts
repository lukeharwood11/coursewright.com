import type { CourseColorKey } from "@/courses/model/courseColor";
import { datesForEvent } from "@/events/model/schedule";
import type { EventAudience } from "@/events/model/audience";

export type CalendarChipKind = "assigned" | "due";

export type CalendarMaterialChip = {
  /** Material or course quiz chip. Default treated as material when omitted in older callers. */
  itemKind?: "material" | "quiz";
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

export type CalendarEventInput = {
  id: number;
  title: string;
  location: string;
  startsOn: string;
  endsOn: string | null;
  startTime: string | null;
  endTime: string | null;
  audience: EventAudience;
  courseIds: number[];
  colorKey?: CourseColorKey | null;
};

export type CalendarEventChip = {
  eventId: number;
  title: string;
  location: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  audience: EventAudience;
  courseIds: number[];
  colorKey: CourseColorKey | null;
};

export function expandEventsInRange(
  events: CalendarEventInput[],
  rangeStart: string,
  rangeEnd: string,
  courses: Array<{ id: number; colorKey: CourseColorKey }> = [],
): CalendarEventChip[] {
  const colorByCourse = new Map(courses.map((course) => [course.id, course.colorKey]));
  const chips: CalendarEventChip[] = [];
  for (const event of events) {
    const colorKey =
      event.colorKey !== undefined
        ? event.colorKey
        : event.audience === "course" && event.courseIds.length === 1
          ? (colorByCourse.get(event.courseIds[0]!) ?? null)
          : null;
    for (const date of datesForEvent(event.startsOn, event.endsOn, rangeStart, rangeEnd)) {
      chips.push({
        eventId: event.id,
        title: event.title,
        location: event.location,
        date,
        startTime: event.startTime,
        endTime: event.endTime,
        audience: event.audience,
        courseIds: event.courseIds,
        colorKey,
      });
    }
  }
  return chips;
}

/** A course event follows that course’s legend toggle. Class and organization events stay. */
export function visibleEvents(
  events: CalendarEventChip[],
  hiddenCourseIds: Set<number>,
): CalendarEventChip[] {
  if (hiddenCourseIds.size === 0) return events;
  return events.filter((event) => {
    if (event.audience !== "course") return true;
    return event.courseIds.some((id) => !hiddenCourseIds.has(id));
  });
}

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
    itemKind?: "material" | "quiz";
  }>,
): CalendarMaterialChip[] {
  const chips: CalendarMaterialChip[] = [];
  for (const material of materials) {
    const itemKind = material.itemKind ?? "material";
    const assigned =
      itemKind === "quiz"
        ? material.scheduledDate
        : assignedDateForChip(
            material.scheduledDate,
            material.unitStart,
            material.unitEnd,
          );
    if (assigned) {
      chips.push({
        itemKind,
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
        itemKind,
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

/** Due only on the calendar (`accepts_until` wall date). Opens is not shown as a chip. */
export function chipsForQuizzes(
  quizzes: Array<{
    id: number;
    title: string;
    courseId: number;
    courseTitle: string;
    colorKey: CourseColorKey;
    dueDate: string | null;
    unitId: number | null;
    unpublished: boolean;
  }>,
): CalendarMaterialChip[] {
  const chips: CalendarMaterialChip[] = [];
  for (const quiz of quizzes) {
    if (quiz.dueDate) {
      chips.push({
        itemKind: "quiz",
        materialId: quiz.id,
        title: quiz.title,
        courseId: quiz.courseId,
        courseTitle: quiz.courseTitle,
        colorKey: quiz.colorKey,
        date: quiz.dueDate,
        kind: "due",
        unitId: quiz.unitId,
        unpublished: quiz.unpublished,
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
  const materialChips = chips.filter((chip) => (chip.itemKind ?? "material") === "material");
  const assigned = new Set(
    materialChips
      .filter((chip) => chip.courseId === courseId && chip.date === date && chip.kind === "assigned")
      .map((chip) => chip.materialId),
  );
  const due = new Set(
    materialChips
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
  for (const chip of materialChips) {
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
      day.date === date
        ? day.materials.map((material) => `${day.courseId}:material:${material.id}`)
        : [],
    ),
  );
  return chips.filter((chip) => {
    if (chip.date !== date) return false;
    const kind = chip.itemKind ?? "material";
    return !covered.has(`${chip.courseId}:${kind}:${chip.materialId}`);
  });
}

/** Assigned/due chips for courses that already have a plan that day (those merge into the class card). */
export function chipsOutsideLessonPlans(
  chips: CalendarMaterialChip[],
  lessonDays: CalendarLessonPlanDay[],
  date: string,
): CalendarMaterialChip[] {
  const coursesWithPlan = new Set(
    lessonDays.filter((day) => day.date === date).map((day) => day.courseId),
  );
  return chips.filter((chip) => chip.date === date && !coursesWithPlan.has(chip.courseId));
}

export type WeekClassCard = {
  date: string;
  courseId: number;
  courseTitle: string;
  colorKey: CourseColorKey;
  planId: number | null;
  unpublished: boolean;
  body: string;
  materials: CalendarLessonPlanDay["materials"];
  chips: CalendarMaterialChip[];
};

/** One block per class on a day: plan text + that class’s materials together. */
export function weekClassCards(
  dates: string[],
  lessonDays: CalendarLessonPlanDay[],
  chips: CalendarMaterialChip[],
): WeekClassCard[] {
  const cards: WeekClassCard[] = [];
  for (const date of dates) {
    const dayPlans = lessonDays
      .filter((day) => day.date === date)
      .slice()
      .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
    for (const plan of dayPlans) {
      cards.push({
        date,
        courseId: plan.courseId,
        courseTitle: plan.courseTitle,
        colorKey: plan.colorKey,
        planId: plan.planId,
        unpublished: plan.unpublished,
        body: plan.body,
        materials: mergeDayMaterials(
          plan.materials.map((material) => ({
            id: material.id,
            title: material.title,
            unitId: material.unitId,
          })),
          chips,
          plan.courseId,
          date,
        ),
        chips: [],
      });
    }
    const leftoverByCourse = new Map<number, CalendarMaterialChip[]>();
    for (const chip of chipsOutsideLessonPlans(chips, lessonDays, date)) {
      const group = leftoverByCourse.get(chip.courseId) ?? [];
      group.push(chip);
      leftoverByCourse.set(chip.courseId, group);
    }
    const leftoverCards: WeekClassCard[] = [];
    for (const group of leftoverByCourse.values()) {
      const first = group[0];
      if (!first) continue;
      leftoverCards.push({
        date,
        courseId: first.courseId,
        courseTitle: first.courseTitle,
        colorKey: first.colorKey,
        planId: null,
        unpublished: false,
        body: "",
        materials: [],
        chips: group,
      });
    }
    leftoverCards.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
    cards.push(...leftoverCards);
  }
  return cards;
}

/** A day belongs on This week when it has plan text, attached materials, or assigned/due chips. */
export function dayHasCalendarContent(
  date: string,
  lessonDays: CalendarLessonPlanDay[],
  chips: CalendarMaterialChip[],
  events: CalendarEventChip[] = [],
): boolean {
  for (const day of lessonDays) {
    if (day.date !== date) continue;
    if (day.body.trim()) return true;
    if (day.materials.length > 0) return true;
  }
  if (chips.some((chip) => chip.date === date)) return true;
  return events.some((event) => event.date === date);
}

export function weekDatesToShow(
  dates: string[],
  lessonDays: CalendarLessonPlanDay[],
  chips: CalendarMaterialChip[],
  omitEmpty: boolean,
  events: CalendarEventChip[] = [],
): string[] {
  if (!omitEmpty) return dates;
  return dates.filter((date) => dayHasCalendarContent(date, lessonDays, chips, events));
}
