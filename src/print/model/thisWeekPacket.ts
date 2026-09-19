import { filterParentDashboard, type ParentDashboard } from "@/parent/model/dashboard";
import { richTextBody } from "@/materials/model/blocks";
import type { PrintMaterial } from "./packet";

export type ThisWeekPrintRef = {
  source: "bulletin" | "material";
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

function bulletinRefsForStudent(
  dashboard: ParentDashboard,
  student: ParentDashboard["students"][number],
  sectionKey: string,
): ThisWeekPrintRef[] {
  return dashboard.bulletins
    .filter((item) => item.students.some((row) => row.id === student.id))
    .map((item) => ({
      source: "bulletin" as const,
      id: item.id,
      courseId: item.courseId,
      sectionKey,
      sectionTitle: student.name,
      contextLines: [item.courseTitle, "Bulletin"],
      title: item.title,
      body: item.body,
    }));
}

/** One student at a time: that child's bulletins, then important now, then this-week materials. */
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
    const bulletins = bulletinRefsForStudent(scoped, student, sectionKey);
    refs.push(...bulletins);

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

export function printMaterialFromBulletin(ref: ThisWeekPrintRef): PrintMaterial {
  const body = ref.body?.trim() ?? "";
  return {
    id: ref.id,
    title: ref.title ?? "Bulletin",
    description: "",
    kind: "page",
    url: null,
    scheduledDate: null,
    itemRole: "bulletin",
    sectionKey: ref.sectionKey,
    sectionTitle: ref.sectionTitle,
    contextLines: ref.contextLines,
    blocks: body ? [{ kind: "rich_text", body: richTextBody(body) }] : [],
    file: null,
  };
}
