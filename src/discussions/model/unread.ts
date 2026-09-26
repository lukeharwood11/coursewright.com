export type DiscussionListItem = {
  lastMessageAt: string;
  lastReadAt: string | null;
  answeredAt: string | null;
  hasVisibleMessages: boolean;
};

export function isDiscussionUnread(item: {
  lastMessageAt: string;
  lastReadAt: string | null;
}): boolean {
  if (!item.lastReadAt) return true;
  return item.lastMessageAt > item.lastReadAt;
}

export function visibleDiscussions<T extends { hasVisibleMessages: boolean }>(
  items: T[],
): T[] {
  return items.filter((item) => item.hasVisibleMessages);
}

export function filterDiscussions<T extends { answeredAt: string | null }>(
  items: T[],
  filter: "all" | "open" | "answered",
): T[] {
  if (filter === "open") return items.filter((item) => item.answeredAt == null);
  if (filter === "answered") return items.filter((item) => item.answeredAt != null);
  return items;
}

/** Unread first, then last activity newest first. */
export function sortDiscussionsForList<
  T extends { lastMessageAt: string; lastReadAt: string | null },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aUnread = isDiscussionUnread(a);
    const bUnread = isDiscussionUnread(b);
    if (aUnread !== bUnread) return aUnread ? -1 : 1;
    if (a.lastMessageAt !== b.lastMessageAt) {
      return a.lastMessageAt < b.lastMessageAt ? 1 : -1;
    }
    return 0;
  });
}

export function countUnreadDiscussions<
  T extends {
    lastMessageAt: string;
    lastReadAt: string | null;
    hasVisibleMessages: boolean;
  },
>(items: T[]): number {
  return visibleDiscussions(items).filter(isDiscussionUnread).length;
}

export function studentsForDiscussion<
  T extends { id: number; name: string },
>(args: {
  audience: "course" | "class" | "organization";
  courseId: number | null;
  classId: number | null;
  students: T[];
  enrollments: Array<{ studentId: number; courseId: number }>;
  classMembers: Array<{ studentId: number; classId: number }>;
}): T[] {
  const ids = new Set<number>();
  if (args.audience === "course" && args.courseId != null) {
    for (const row of args.enrollments) {
      if (row.courseId === args.courseId) ids.add(row.studentId);
    }
  } else if (args.audience === "class" && args.classId != null) {
    for (const row of args.classMembers) {
      if (row.classId === args.classId) ids.add(row.studentId);
    }
  }
  return args.students
    .filter((student) => ids.has(student.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function forStudentsLabel(
  students: Array<{ name: string }>,
): string | null {
  if (students.length === 0) return null;
  const names = students.map((student) => student.name);
  if (names.length === 1) return `For ${names[0]}`;
  if (names.length === 2) return `For ${names[0]} and ${names[1]}`;
  return `For ${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}
