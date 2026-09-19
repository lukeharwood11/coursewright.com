import type { CalendarWeek } from "./thisWeek";
import { isInCalendarWeek, localIsoDate } from "./thisWeek";

export type ParentDashboardMaterial = {
  id: number;
  title: string;
  /** When the work is assigned / for This week (scheduled_date, else unit start). */
  assignedDate: string | null;
  dueDate: string | null;
  unitId: number | null;
};

export type ParentDashboardCourse = {
  id: number;
  title: string;
  materials: ParentDashboardMaterial[];
};

export type ParentDashboardStudent = {
  id: number;
  name: string;
  gradeLevel: string | null;
  hasActiveEnrollment: boolean;
  courses: ParentDashboardCourse[];
};

export type ParentImportantNowItem = {
  id: number;
  materialId: number;
  materialTitle: string;
  materialDescription: string;
  courseId: number;
  courseTitle: string;
  unitId: number | null;
};

export type ParentDashboardNextItem = {
  studentId: number;
  studentName: string;
  courseId: number;
  courseTitle: string;
  material: ParentDashboardMaterial;
  /** The date that ranked this item (assignment date or due date). */
  sortDate: string;
};

export type ParentDashboard = {
  week: CalendarWeek;
  importantNow: ParentImportantNowItem[];
  students: ParentDashboardStudent[];
  /** Soonest assigned materials on or after today. */
  nextAssigned: ParentDashboardNextItem[];
  /** Soonest due materials on or after today. */
  nextDue: ParentDashboardNextItem[];
  nextAssignedItem: ParentDashboardNextItem | null;
  nextDueItem: ParentDashboardNextItem | null;
  hasActiveEnrollment: boolean;
};

export type ParentDashboardSource = {
  week: CalendarWeek;
  today: string;
  students: Array<{ id: number; name: string; gradeLevel: string | null }>;
  enrollments: Array<{
    studentId: number;
    courseId: number;
    courseTitle: string;
    courseStatus: string;
  }>;
  materials: Array<{
    id: number;
    title: string;
    scheduledDate: string | null;
    dueDate: string | null;
    courseId: number;
    unitId: number | null;
    unitStart: string | null;
    unitEnd: string | null;
  }>;
  importantNow: Array<{
    id: number;
    materialId: number;
    materialTitle: string;
    materialDescription: string;
    courseId: number;
    courseTitle: string;
    unitId: number | null;
  }>;
};

export function materialEffectiveDate(
  scheduledDate: string | null,
  unitStart: string | null,
  unitEnd: string | null,
): string | null {
  if (scheduledDate) return scheduledDate;
  if (unitStart && unitEnd) return unitStart;
  return null;
}

function toDashboardMaterial(
  material: ParentDashboardSource["materials"][number],
): ParentDashboardMaterial {
  return {
    id: material.id,
    title: material.title,
    assignedDate: materialEffectiveDate(
      material.scheduledDate,
      material.unitStart,
      material.unitEnd,
    ),
    dueDate: material.dueDate,
    unitId: material.unitId,
  };
}

export function buildParentDashboard(source: ParentDashboardSource): ParentDashboard {
  const activeCourseIds = new Set(
    source.enrollments
      .filter((row) => row.courseStatus === "active")
      .map((row) => row.courseId),
  );

  const students = source.students.map((student) => {
    const studentEnrollments = source.enrollments.filter(
      (row) => row.studentId === student.id && row.courseStatus === "active",
    );
    const courses = studentEnrollments.map((enrollment) => {
      const materials = source.materials
        .filter(
          (material) =>
            material.courseId === enrollment.courseId &&
            isInCalendarWeek(
              source.week,
              material.scheduledDate,
              material.unitStart,
              material.unitEnd,
              material.dueDate,
            ),
        )
        .map(toDashboardMaterial)
        .sort(compareWeekMaterials);
      return {
        id: enrollment.courseId,
        title: enrollment.courseTitle,
        materials,
      };
    });
    return {
      id: student.id,
      name: student.name,
      gradeLevel: student.gradeLevel,
      hasActiveEnrollment: studentEnrollments.length > 0,
      courses,
    };
  });

  const importantNow = source.importantNow.filter((item) =>
    activeCourseIds.has(item.courseId),
  );

  const nextAssigned = collectNextByDate(source, "assigned");
  const nextDue = collectNextByDate(source, "due");

  return {
    week: source.week,
    importantNow,
    students,
    nextAssigned,
    nextDue,
    nextAssignedItem: nextAssigned[0] ?? null,
    nextDueItem: nextDue[0] ?? null,
    hasActiveEnrollment: students.some((student) => student.hasActiveEnrollment),
  };
}

export function filterParentDashboard(
  dashboard: ParentDashboard,
  activeStudentIds: number[],
): ParentDashboard {
  const allowed = new Set(activeStudentIds);
  const students = dashboard.students.filter((student) => allowed.has(student.id));
  const courseIds = new Set(
    students.flatMap((student) => student.courses.map((course) => course.id)),
  );
  const importantNow = dashboard.importantNow.filter((item) =>
    courseIds.has(item.courseId),
  );
  const nextAssigned = dashboard.nextAssigned.filter((item) =>
    allowed.has(item.studentId),
  );
  const nextDue = dashboard.nextDue.filter((item) => allowed.has(item.studentId));
  return {
    ...dashboard,
    students,
    importantNow,
    nextAssigned,
    nextDue,
    nextAssignedItem: nextAssigned[0] ?? null,
    nextDueItem: nextDue[0] ?? null,
    hasActiveEnrollment: students.some((student) => student.hasActiveEnrollment),
  };
}

export function toggleStudentId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

export function datedMaterialCount(students: ParentDashboardStudent[]): number {
  return students.reduce(
    (count, student) =>
      count +
      student.courses.reduce((inner, course) => inner + course.materials.length, 0),
    0,
  );
}

export function coursesWithDatedMaterials(
  courses: ParentDashboardCourse[],
): ParentDashboardCourse[] {
  return courses.filter((course) => course.materials.length > 0);
}

/** This-week list: drop empty course shells; keep unenrolled students for a plain-language note. */
export function thisWeekStudents(
  students: ParentDashboardStudent[],
): ParentDashboardStudent[] {
  return students
    .map((student) => ({
      ...student,
      courses: coursesWithDatedMaterials(student.courses),
    }))
    .filter(
      (student) => student.courses.length > 0 || !student.hasActiveEnrollment,
    );
}

function compareWeekMaterials(
  a: ParentDashboardMaterial,
  b: ParentDashboardMaterial,
): number {
  const aKey = a.assignedDate ?? a.dueDate ?? "";
  const bKey = b.assignedDate ?? b.dueDate ?? "";
  if (aKey !== bKey) return aKey.localeCompare(bKey);
  return a.title.localeCompare(b.title);
}

function collectNextByDate(
  source: ParentDashboardSource,
  kind: "assigned" | "due",
): ParentDashboardNextItem[] {
  const today = source.today || localIsoDate();
  const items: ParentDashboardNextItem[] = [];

  for (const student of source.students) {
    const enrollments = source.enrollments.filter(
      (row) => row.studentId === student.id && row.courseStatus === "active",
    );
    for (const enrollment of enrollments) {
      for (const material of source.materials) {
        if (material.courseId !== enrollment.courseId) continue;
        const sortDate =
          kind === "assigned"
            ? materialEffectiveDate(
                material.scheduledDate,
                material.unitStart,
                material.unitEnd,
              )
            : material.dueDate;
        if (!sortDate || sortDate < today) continue;
        items.push({
          studentId: student.id,
          studentName: student.name,
          courseId: enrollment.courseId,
          courseTitle: enrollment.courseTitle,
          sortDate,
          material: toDashboardMaterial(material),
        });
      }
    }
  }

  items.sort((a, b) => {
    if (a.sortDate !== b.sortDate) return a.sortDate.localeCompare(b.sortDate);
    if (a.studentName !== b.studentName) {
      return a.studentName.localeCompare(b.studentName);
    }
    return a.material.title.localeCompare(b.material.title);
  });

  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.studentId}:${item.material.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
