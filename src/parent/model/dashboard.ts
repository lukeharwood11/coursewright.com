import type { CalendarWeek } from "./thisWeek";
import { isDueInCalendarWeek, isInCalendarWeek, localIsoDate } from "./thisWeek";
import { isBulletinAvailable } from "@/bulletins/model/availability";
import { isAnnouncementAvailable } from "@/announcements/model/availability";
import type { AnnouncementAudience } from "@/announcements/model/audience";

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

export type ParentBulletinStudent = {
  id: number;
  name: string;
};

export type ParentBulletinItem = {
  id: number;
  title: string;
  body: string;
  startDate: string;
  endDate: string;
  courseId: number;
  courseTitle: string;
  materialCount: number;
  students: ParentBulletinStudent[];
};

export type ParentAnnouncementItem = {
  id: number;
  title: string;
  body: string;
  startDate: string | null;
  endDate: string | null;
  audience: AnnouncementAudience;
  courseId: number | null;
  classId: number | null;
  studentId: number | null;
  courseTitle: string | null;
  classTitle: string | null;
  studentName: string | null;
  read: boolean;
  students: ParentBulletinStudent[];
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
  announcements: ParentAnnouncementItem[];
  bulletins: ParentBulletinItem[];
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
  bulletins?: Array<{
    id: number;
    title: string;
    body: string;
    startDate: string;
    endDate: string;
    courseId: number;
    courseTitle: string;
    materialCount: number;
  }>;
  classMemberships?: Array<{ classId: number; studentId: number }>;
  announcements?: Array<{
    id: number;
    title: string;
    body: string;
    startDate: string | null;
    endDate: string | null;
    audience: AnnouncementAudience;
    courseId: number | null;
    classId: number | null;
    studentId: number | null;
    courseTitle: string | null;
    classTitle: string | null;
    studentName: string | null;
    read: boolean;
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

  const students = [...source.students]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((student) => {
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

  const seenBulletins = new Set<number>();
  const bulletins = (source.bulletins ?? [])
    .filter((item) => {
      if (!activeCourseIds.has(item.courseId)) return false;
      if (!isBulletinAvailable(source.today, item.startDate, item.endDate)) {
        return false;
      }
      if (seenBulletins.has(item.id)) return false;
      seenBulletins.add(item.id);
      return true;
    })
    .map((item) => ({
      ...item,
      students: studentsForCourse(source, item.courseId),
    }))
    .sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
      return a.title.localeCompare(b.title);
    });

  const seenAnnouncements = new Set<number>();
  const announcements = (source.announcements ?? [])
    .filter((item) => {
      if (!isAnnouncementAvailable(source.today, item.startDate, item.endDate)) {
        return false;
      }
      if (seenAnnouncements.has(item.id)) return false;
      seenAnnouncements.add(item.id);
      return studentsForAnnouncement(source, item).length > 0;
    })
    .map((item) => ({
      ...item,
      students: studentsForAnnouncement(source, item),
    }))
    .sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      const aStart = a.startDate ?? "";
      const bStart = b.startDate ?? "";
      if (aStart !== bStart) return aStart.localeCompare(bStart);
      return a.title.localeCompare(b.title);
    });

  const nextAssigned = collectNextByDate(source, "assigned");
  const nextDue = collectNextByDate(source, "due");

  return {
    week: source.week,
    importantNow,
    announcements,
    bulletins,
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
  const bulletins = dashboard.bulletins
    .map((item) => ({
      ...item,
      students: item.students.filter((student) => allowed.has(student.id)),
    }))
    .filter((item) => item.students.length > 0);
  const announcements = dashboard.announcements
    .map((item) => ({
      ...item,
      students: item.students.filter((student) => allowed.has(student.id)),
    }))
    .filter((item) => item.students.length > 0);
  const nextAssigned = dashboard.nextAssigned.filter((item) =>
    allowed.has(item.studentId),
  );
  const nextDue = dashboard.nextDue.filter((item) => allowed.has(item.studentId));
  return {
    ...dashboard,
    students,
    importantNow,
    announcements,
    bulletins,
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

export function isMaterialDueInWeek(
  week: CalendarWeek,
  material: ParentDashboardMaterial,
): boolean {
  return isDueInCalendarWeek(week, material.dueDate);
}

/** Parent home default: due this week only. Print this week still uses the full dated list. */
export function dueThisWeekStudents(
  students: ParentDashboardStudent[],
  week: CalendarWeek,
): ParentDashboardStudent[] {
  return thisWeekStudents(
    students.map((student) => ({
      ...student,
      courses: student.courses.map((course) => ({
        ...course,
        materials: course.materials.filter((material) =>
          isMaterialDueInWeek(week, material),
        ),
      })),
    })),
  );
}

export function extraAssignedThisWeekCount(
  students: ParentDashboardStudent[],
  week: CalendarWeek,
): number {
  return datedMaterialCount(
    students.map((student) => ({
      ...student,
      courses: student.courses.map((course) => ({
        ...course,
        materials: course.materials.filter(
          (material) => !isMaterialDueInWeek(week, material),
        ),
      })),
    })),
  );
}

export function extraAssignedThisWeekLabel(count: number): string {
  return count === 1
    ? "1 more assigned this week"
    : `${count} more assigned this week`;
}

export function bulletinsForStudent(
  bulletins: ParentBulletinItem[],
  studentId: number,
): ParentBulletinItem[] {
  return bulletins.filter((item) =>
    item.students.some((student) => student.id === studentId),
  );
}

export function announcementsForStudent(
  announcements: ParentAnnouncementItem[],
  studentId: number,
): ParentAnnouncementItem[] {
  return announcements.filter((item) =>
    item.students.some((student) => student.id === studentId),
  );
}

export type ParentHomeStudentSection = {
  student: ParentDashboardStudent;
  weekStudent: ParentDashboardStudent | null;
  announcements: ParentAnnouncementItem[];
  bulletins: ParentBulletinItem[];
};

/** Visible students in name order, with that child's announcements then bulletins ahead of this-week work. */
export function parentHomeStudentSections(
  students: ParentDashboardStudent[],
  weekStudents: ParentDashboardStudent[],
  bulletins: ParentBulletinItem[],
  announcements: ParentAnnouncementItem[] = [],
): ParentHomeStudentSection[] {
  const weekById = new Map(weekStudents.map((student) => [student.id, student]));
  return students.flatMap((student) => {
    const notes = bulletinsForStudent(bulletins, student.id);
    const notices = announcementsForStudent(announcements, student.id);
    const weekStudent = weekById.get(student.id) ?? null;
    if (notes.length === 0 && notices.length === 0 && !weekStudent) return [];
    return [{ student, weekStudent, announcements: notices, bulletins: notes }];
  });
}

/** Multi-student parent home: which children a bulletin is for. */
export function bulletinForStudentsLabel(
  students: ParentBulletinStudent[],
): string | null {
  if (students.length === 0) return null;
  const names = students.map((student) => student.name);
  if (names.length === 1) return `For ${names[0]}`;
  if (names.length === 2) return `For ${names[0]} and ${names[1]}`;
  return `For ${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function studentsForCourse(
  source: ParentDashboardSource,
  courseId: number,
): ParentBulletinStudent[] {
  const ids = new Set(
    source.enrollments
      .filter((row) => row.courseId === courseId && row.courseStatus === "active")
      .map((row) => row.studentId),
  );
  return source.students
    .filter((student) => ids.has(student.id))
    .map((student) => ({ id: student.id, name: student.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function studentsForAnnouncement(
  source: ParentDashboardSource,
  item: NonNullable<ParentDashboardSource["announcements"]>[number],
): ParentBulletinStudent[] {
  if (item.audience === "course" && item.courseId != null) {
    return studentsForCourse(source, item.courseId);
  }
  if (item.audience === "class" && item.classId != null) {
    const ids = new Set(
      (source.classMemberships ?? [])
        .filter((row) => row.classId === item.classId)
        .map((row) => row.studentId),
    );
    return source.students
      .filter((student) => ids.has(student.id))
      .map((student) => ({ id: student.id, name: student.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  if (item.audience === "student" && item.studentId != null) {
    return source.students
      .filter((student) => student.id === item.studentId)
      .map((student) => ({ id: student.id, name: student.name }));
  }
  return [];
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
