export const COURSE_LIST_PAGE_SIZE = 12;

export type CourseListFilterable = {
  title: string;
  description: string;
  location: string;
  subject: string;
  gradeLevels: string[];
};

export type CourseListFilters = {
  query: string;
  subject: string;
  grades: string[];
};

export function courseMatchesFilters(
  course: CourseListFilterable,
  filters: CourseListFilters,
): boolean {
  if (filters.subject && course.subject !== filters.subject) return false;

  if (filters.grades.length > 0) {
    const hasGrade = filters.grades.some((grade) =>
      course.gradeLevels.includes(grade),
    );
    if (!hasGrade) return false;
  }

  const needle = filters.query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    course.title,
    course.description,
    course.location,
    course.subject,
    ...course.gradeLevels,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

export function filterCourses<T extends CourseListFilterable>(
  courses: T[],
  filters: CourseListFilters,
): T[] {
  return courses.filter((course) => courseMatchesFilters(course, filters));
}

export function uniqueCourseSubjects(
  courses: Array<{ subject: string }>,
): string[] {
  const subjects = new Set<string>();
  for (const course of courses) {
    const subject = course.subject.trim();
    if (subject) subjects.add(subject);
  }
  return [...subjects].sort((a, b) => a.localeCompare(b));
}

export function courseListPageCount(total: number, pageSize = COURSE_LIST_PAGE_SIZE): number {
  if (total <= 0) return 1;
  return Math.ceil(total / pageSize);
}

export function clampCourseListPage(
  page: number,
  total: number,
  pageSize = COURSE_LIST_PAGE_SIZE,
): number {
  const maxPage = courseListPageCount(total, pageSize);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(page, maxPage);
}

export function paginateCourses<T>(
  courses: T[],
  page: number,
  pageSize = COURSE_LIST_PAGE_SIZE,
): T[] {
  const safePage = clampCourseListPage(page, courses.length, pageSize);
  const start = (safePage - 1) * pageSize;
  return courses.slice(start, start + pageSize);
}

export function courseListRangeLabel(
  total: number,
  page: number,
  pageSize = COURSE_LIST_PAGE_SIZE,
): string {
  if (total === 0) return "0 courses";
  const safePage = clampCourseListPage(page, total, pageSize);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);
  if (start === end && total === 1) return "1 course";
  return `${start}–${end} of ${total}`;
}
