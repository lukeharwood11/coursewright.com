import { filterParentDashboard, type ParentDashboard } from "@/parent/model/dashboard";

export type ThisWeekPrintRef = {
  materialId: number;
  courseId: number;
  contextLines: string[];
};

/** Unique materials in parent-home order: important now, then per student → course. */
export function thisWeekPrintRefs(
  dashboard: ParentDashboard,
  studentIds?: number[] | null,
): ThisWeekPrintRef[] {
  const scoped =
    studentIds && studentIds.length > 0
      ? filterParentDashboard(dashboard, studentIds)
      : dashboard;
  const byId = new Map<number, ThisWeekPrintRef>();

  function add(
    materialId: number,
    courseId: number,
    contextLine: string | null,
  ) {
    const existing = byId.get(materialId);
    if (existing) {
      if (contextLine && !existing.contextLines.includes(contextLine)) {
        existing.contextLines.push(contextLine);
      }
      return;
    }
    byId.set(materialId, {
      materialId,
      courseId,
      contextLines: contextLine ? [contextLine] : [],
    });
  }

  for (const item of scoped.importantNow) {
    add(item.materialId, item.courseId, `${item.courseTitle} · Important now`);
  }

  for (const student of scoped.students) {
    for (const course of student.courses) {
      for (const material of course.materials) {
        add(material.id, course.id, `${student.name} · ${course.title}`);
      }
    }
  }

  return [...byId.values()];
}
