import type { CourseColorKey } from "@/courses/model/courseColor";
import { parseCourseColorKey } from "@/courses/model/courseColor";
import type { EventAudience } from "@/events/model/audience";
import { lessonPlanIsPublished } from "@/lesson-plans/model/visibility";
import { isAnnouncementAvailable } from "@/announcements/model/availability";
import type { AnnouncementAudience } from "@/announcements/model/audience";
import type { CalendarWeek } from "./thisWeek";
import { isDueInCalendarWeek, isInCalendarWeek, localIsoDate } from "./thisWeek";

export type ParentDashboardMaterial = {
  id: number;
  title: string;
  /** When the work is assigned / for This week (scheduled_date, else unit start). */
  assignedDate: string | null;
  dueDate: string | null;
  unitId: number | null;
  itemKind?: "material" | "quiz";
};

export type ParentDashboardCourse = {
  id: number;
  title: string;
  colorKey: CourseColorKey;
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

export type ParentLessonPlanDay = {
  date: string;
  body: string;
  materials: Array<{ id: number; title: string; unitId: number | null }>;
};

export type ParentLessonPlanItem = {
  id: number;
  title: string;
  weekNote: string;
  weekStart: string;
  courseId: number;
  courseTitle: string;
  colorKey: CourseColorKey;
  unpublished: boolean;
  days: ParentLessonPlanDay[];
};

export type ParentDashboardCourseMeta = {
  id: number;
  title: string;
  colorKey: CourseColorKey;
};

export type ParentAnnouncementStudent = {
  id: number;
  name: string;
};

export type ParentAnnouncementItem = {
  id: number;
  title: string;
  body: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  authorName: string;
  audience: AnnouncementAudience;
  courseIds: number[];
  classIds: number[];
  studentIds: number[];
  courseTitles: string[];
  classTitles: string[];
  studentNames: string[];
  read: boolean;
  students: ParentAnnouncementStudent[];
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

export type ParentDashboardEvent = {
  id: number;
  title: string;
  location: string;
  startsOn: string;
  endsOn: string | null;
  startTime: string | null;
  endTime: string | null;
  audience: EventAudience;
  courseIds: number[];
  colorKey: CourseColorKey | null;
  studentIds: number[];
};

export type ParentDashboard = {
  week: CalendarWeek;
  importantNow: ParentImportantNowItem[];
  announcements: ParentAnnouncementItem[];
  lessonPlans: ParentLessonPlanItem[];
  events: ParentDashboardEvent[];
  courses: ParentDashboardCourseMeta[];
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
    colorKey?: string | null;
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
    itemKind?: "material" | "quiz";
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
  lessonPlans?: Array<{
    id: number;
    title: string;
    weekNote: string;
    weekStart: string;
    courseId: number;
    courseTitle: string;
    colorKey?: string | null;
    visibility: string;
    days: Array<{
      date: string;
      body: string;
      materials: Array<{ id: number; title: string; unitId: number | null }>;
    }>;
  }>;
  classMemberships?: Array<{ classId: number; studentId: number }>;
  events?: Array<{
    id: number;
    title: string;
    location: string;
    startsOn: string;
    endsOn: string | null;
    startTime: string | null;
    endTime: string | null;
    audience: EventAudience;
    courseIds: number[];
    classIds: number[];
  }>;
  announcements?: Array<{
    id: number;
    title: string;
    body: string;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    authorName: string;
    audience: AnnouncementAudience;
    courseIds: number[];
    classIds: number[];
    studentIds: number[];
    courseTitles: string[];
    classTitles: string[];
    studentNames: string[];
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
    itemKind: material.itemKind ?? "material",
  };
}

function colorForEnrollment(
  enrollment: ParentDashboardSource["enrollments"][number],
): CourseColorKey {
  return parseCourseColorKey(enrollment.colorKey);
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
          colorKey: colorForEnrollment(enrollment),
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

  const lessonPlans = (source.lessonPlans ?? [])
    .filter((item) => {
      if (!activeCourseIds.has(item.courseId)) return false;
      if (item.weekStart !== source.week.start) return false;
      if (!lessonPlanIsPublished(item.visibility === "published" ? "published" : "unpublished")) {
        return false;
      }
      return true;
    })
    .map((item) => ({
      id: item.id,
      title: item.title,
      weekNote: item.weekNote,
      weekStart: item.weekStart,
      courseId: item.courseId,
      courseTitle: item.courseTitle,
      colorKey: parseCourseColorKey(item.colorKey),
      unpublished: false,
      days: [...item.days]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((day) => ({
          date: day.date,
          body: day.body,
          materials: day.materials,
        })),
    }))
    .sort((a, b) => {
      if (a.courseTitle !== b.courseTitle) return a.courseTitle.localeCompare(b.courseTitle);
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

  const events = (source.events ?? []).flatMap((item) => {
    const studentIds = studentIdsForEvent(source, item);
    if (studentIds.length === 0) return [];
    const colorKey =
      item.audience === "course" && item.courseIds.length === 1
        ? parseCourseColorKey(
            source.enrollments.find((row) => row.courseId === item.courseIds[0])?.colorKey,
          )
        : null;
    return [
      {
        id: item.id,
        title: item.title,
        location: item.location,
        startsOn: item.startsOn,
        endsOn: item.endsOn,
        startTime: item.startTime,
        endTime: item.endTime,
        audience: item.audience,
        courseIds: item.courseIds,
        colorKey: item.audience === "course" && item.courseIds.length === 1 ? colorKey : null,
        studentIds,
      },
    ];
  });

  const nextAssigned = collectNextByDate(source, "assigned");
  const nextDue = collectNextByDate(source, "due");

  return {
    week: source.week,
    importantNow,
    announcements,
    lessonPlans,
    events,
    courses: coursesFromStudents(students),
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
  const lessonPlans = dashboard.lessonPlans.filter((item) =>
    courseIds.has(item.courseId),
  );
  const events = (dashboard.events ?? []).filter((event) =>
    event.studentIds.some((id) => allowed.has(id)),
  );
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
    courses: coursesFromStudents(students),
    importantNow,
    announcements,
    lessonPlans,
    events,
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

export function parentWeekHasContent(dashboard: ParentDashboard): boolean {
  return (
    dashboard.lessonPlans.length > 0 ||
    datedMaterialCount(dashboard.students) > 0 ||
    (dashboard.events ?? []).length > 0
  );
}

function studentIdsForEvent(
  source: ParentDashboardSource,
  item: NonNullable<ParentDashboardSource["events"]>[number],
): number[] {
  if (item.audience === "organization") {
    return source.students.map((student) => student.id);
  }
  if (item.audience === "course") {
    const courseId = item.courseIds[0];
    if (courseId == null) return [];
    return [
      ...new Set(
        source.enrollments
          .filter((row) => row.courseId === courseId && row.courseStatus === "active")
          .map((row) => row.studentId),
      ),
    ];
  }
  const classIds = new Set(item.classIds);
  return [
    ...new Set(
      (source.classMemberships ?? [])
        .filter((row) => classIds.has(row.classId))
        .map((row) => row.studentId),
    ),
  ];
}

function coursesFromStudents(
  students: ParentDashboardStudent[],
): ParentDashboardCourseMeta[] {
  const map = new Map<number, ParentDashboardCourseMeta>();
  for (const student of students) {
    for (const course of student.courses) {
      if (!map.has(course.id)) {
        map.set(course.id, {
          id: course.id,
          title: course.title,
          colorKey: course.colorKey,
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.title.localeCompare(b.title));
}

/** Print this week still uses the full dated list. */
export function thisWeekStudents(
  students: ParentDashboardStudent[],
): ParentDashboardStudent[] {
  return students
    .map((student) => ({
      ...student,
      courses: student.courses.filter((course) => course.materials.length > 0),
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

/** Multi-student parent home: which children an announcement is for. */
export function bulletinForStudentsLabel(
  students: ParentAnnouncementStudent[],
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
): ParentAnnouncementStudent[] {
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
): ParentAnnouncementStudent[] {
  if (item.audience === "course" && item.courseIds.length > 0) {
    const byId = new Map<number, ParentAnnouncementStudent>();
    for (const courseId of item.courseIds) {
      for (const student of studentsForCourse(source, courseId)) {
        byId.set(student.id, student);
      }
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
  if (item.audience === "class" && item.classIds.length > 0) {
    const classIdSet = new Set(item.classIds);
    const ids = new Set(
      (source.classMemberships ?? [])
        .filter((row) => classIdSet.has(row.classId))
        .map((row) => row.studentId),
    );
    return source.students
      .filter((student) => ids.has(student.id))
      .map((student) => ({ id: student.id, name: student.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  if (item.audience === "student" && item.studentIds.length > 0) {
    const idSet = new Set(item.studentIds);
    return source.students
      .filter((student) => idSet.has(student.id))
      .map((student) => ({ id: student.id, name: student.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
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
    const key = `${item.studentId}:${item.material.itemKind ?? "material"}:${item.material.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
