import { filterParentDashboard, type ParentDashboard } from "@/parent/model/dashboard";

export type ThisWeekPrintRef = {
  materialId: number;
  courseId: number;
  sectionKey: string;
  sectionTitle: string;
  contextLines: string[];
};

function courseTitleForStudent(
  student: ParentDashboard["students"][number],
  courseId: number,
  fallback: string,
): string {
  return student.courses.find((course) => course.id === courseId)?.title ?? fallback;
}

/** One student's materials at a time: important now, then this-week by course. */
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

    for (const item of scoped.importantNow) {
      if (!courseIds.has(item.courseId) || seen.has(item.materialId)) continue;
      seen.add(item.materialId);
      const courseTitle = courseTitleForStudent(
        student,
        item.courseId,
        item.courseTitle,
      );
      refs.push({
        materialId: item.materialId,
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
          materialId: material.id,
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
