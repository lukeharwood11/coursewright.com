import { filterParentDashboard, type ParentDashboard, type ParentLessonPlanItem } from "@/parent/model/dashboard";
import { weekdayDateLabel } from "@/lesson-plans/model/validate";
import { richTextBody } from "@/materials/model/blocks";
import type { PrintMaterial } from "./packet";

export type ThisWeekPrintRef = {
  source: "lesson_plan" | "material";
  id: number;
  courseId: number;
  sectionKey: string;
  sectionTitle: string;
  contextLines: string[];
  title?: string;
  body?: string;
};

function courseTitleForStudent(
  student: ParentDashboard["students"][number],
  courseId: number,
  fallback: string,
): string {
  return student.courses.find((course) => course.id === courseId)?.title ?? fallback;
}

export function lessonPlanPrintBody(plan: ParentLessonPlanItem): string {
  const parts: string[] = [];
  if (plan.weekNote.trim()) parts.push(plan.weekNote.trim());
  for (const day of plan.days) {
    if (!day.body.trim()) continue;
    parts.push(`${weekdayDateLabel(day.date)}\n${day.body.trim()}`);
  }
  return parts.join("\n\n");
}

function lessonPlanRefsForStudent(
  dashboard: ParentDashboard,
  student: ParentDashboard["students"][number],
  sectionKey: string,
): ThisWeekPrintRef[] {
  const courseIds = new Set(student.courses.map((course) => course.id));
  return dashboard.lessonPlans
    .filter((item) => courseIds.has(item.courseId))
    .map((item) => ({
      source: "lesson_plan" as const,
      id: item.id,
      courseId: item.courseId,
      sectionKey,
      sectionTitle: student.name,
      contextLines: [item.courseTitle, "Lesson plan"],
      title: item.title,
      body: lessonPlanPrintBody(item),
    }));
}

/** One student at a time: that child's lesson plans, then important now, then this-week materials. */
export function thisWeekPrintRefs(
  dashboard: ParentDashboard,
  studentIds?: number[] | null,
): ThisWeekPrintRef[] {
  const scoped =
    studentIds && studentIds.length > 0
      ? filterParentDashboard(dashboard, studentIds)
      : dashboard;
  const refs: ThisWeekPrintRef[] = [];

  for (const student of scoped.students) {
    const seen = new Set<number>();
    const courseIds = new Set(student.courses.map((course) => course.id));
    const sectionKey = `student-${student.id}`;
    refs.push(...lessonPlanRefsForStudent(scoped, student, sectionKey));

    for (const item of scoped.importantNow) {
      if (!courseIds.has(item.courseId) || seen.has(item.materialId)) continue;
      seen.add(item.materialId);
      const courseTitle = courseTitleForStudent(
        student,
        item.courseId,
        item.courseTitle,
      );
      refs.push({
        source: "material",
        id: item.materialId,
        courseId: item.courseId,
        sectionKey,
        sectionTitle: student.name,
        contextLines: [`${courseTitle} · Important now`],
      });
    }

    for (const course of student.courses) {
      for (const material of course.materials) {
        if (seen.has(material.id)) continue;
        seen.add(material.id);
        refs.push({
          source: "material",
          id: material.id,
          courseId: course.id,
          sectionKey,
          sectionTitle: student.name,
          contextLines: [course.title],
        });
      }
    }
  }

  return refs;
}

export function printMaterialFromLessonPlan(ref: ThisWeekPrintRef): PrintMaterial {
  const body = ref.body?.trim() ?? "";
  return {
    id: ref.id,
    title: ref.title ?? "Lesson plan",
    description: "",
    kind: "page",
    url: null,
    scheduledDate: null,
    itemRole: "lesson_plan",
    sectionKey: ref.sectionKey,
    sectionTitle: ref.sectionTitle,
    contextLines: ref.contextLines,
    blocks: body ? [{ kind: "rich_text", body: richTextBody(body) }] : [],
    file: null,
  };
}
