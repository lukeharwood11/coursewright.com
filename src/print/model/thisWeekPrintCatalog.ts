import {
  filterParentDashboard,
  isMaterialDueInWeek,
  type ParentDashboard,
  type ParentDashboardMaterial,
  type ParentLessonPlanItem,
} from "@/parent/model/dashboard";
import { isAssignedInCalendarWeek } from "@/parent/model/thisWeek";
import { canShowAnswerKey } from "@/quizzes/model/quiz";
import {
  quizKeyModeForQuiz,
  type QuizKeyPrintMode,
} from "./quizKeyPrintMode";
import {
  lessonPlanPrintBody,
  type ThisWeekPrintRef,
} from "./thisWeekPacket";

export type ThisWeekPrintItemKind = "lesson_plan_notes" | "material" | "quiz";

export type ThisWeekPrintCategory =
  | "lesson_plan_notes"
  | "lesson_plan_material"
  | "important_now"
  | "assigned"
  | "due";

export function printKeyLessonPlanNotes(studentId: number, planId: number): string {
  return `s${studentId}:lp:${planId}:notes`;
}

export function printKeyMaterial(studentId: number, materialId: number): string {
  return `s${studentId}:m:${materialId}`;
}

export function printKeyQuiz(studentId: number, quizId: number): string {
  return `s${studentId}:q:${quizId}`;
}

export type ThisWeekPrintCatalogItem = {
  printKey: string;
  studentId: number;
  studentName: string;
  itemKind: ThisWeekPrintItemKind;
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  contextLabels: string[];
  categories: ThisWeekPrintCategory[];
  lessonPlanId?: number;
  body?: string;
  sortOrder: number;
  /** Course quiz only — for print options when share key with parents is on. */
  shareAnswerKeyWithParents?: boolean;
};

export type ThisWeekPrintCatalog = {
  items: ThisWeekPrintCatalogItem[];
  students: Array<{ id: number; name: string }>;
};

export type ThisWeekPrintSelectionOptions = {
  omittedKeys: Set<string>;
  breakKeys: Set<string>;
  pack: boolean;
  studentBreaks: boolean;
  quizKeyModes: Map<number, QuizKeyPrintMode>;
};

function courseTitleForStudent(
  student: ParentDashboard["students"][number],
  courseId: number,
  fallback: string,
): string {
  return student.courses.find((course) => course.id === courseId)?.title ?? fallback;
}

function materialCategories(
  week: ParentDashboard["week"],
  material: ParentDashboardMaterial,
  importantNowIds: Set<number>,
): ThisWeekPrintCategory[] {
  const categories: ThisWeekPrintCategory[] = [];
  if (importantNowIds.has(material.id)) categories.push("important_now");
  const assigned = Boolean(
    material.assignedDate &&
      isAssignedInCalendarWeek(week, material.assignedDate, null, null),
  );
  const due = isMaterialDueInWeek(week, material);
  if (assigned) categories.push("assigned");
  if (due) categories.push("due");
  return categories;
}

function upsertItem(
  map: Map<string, ThisWeekPrintCatalogItem>,
  item: ThisWeekPrintCatalogItem,
): void {
  const existing = map.get(item.printKey);
  if (!existing) {
    map.set(item.printKey, item);
    return;
  }
  const categories = [...new Set([...existing.categories, ...item.categories])];
  const contextLabels = [...new Set([...existing.contextLabels, ...item.contextLabels])];
  map.set(item.printKey, {
    ...existing,
    categories,
    contextLabels,
    sortOrder: Math.min(existing.sortOrder, item.sortOrder),
    lessonPlanId: existing.lessonPlanId ?? item.lessonPlanId,
  });
}

export function buildThisWeekPrintCatalog(
  dashboard: ParentDashboard,
  studentIds?: number[] | null,
): ThisWeekPrintCatalog {
  const scoped =
    studentIds && studentIds.length > 0
      ? filterParentDashboard(dashboard, studentIds)
      : dashboard;
  const map = new Map<string, ThisWeekPrintCatalogItem>();
  let sortOrder = 0;

  for (const student of scoped.students) {
    const courseIds = new Set(student.courses.map((course) => course.id));
    const importantNowIds = new Set(
      scoped.importantNow
        .filter((item) => courseIds.has(item.courseId))
        .map((item) => item.materialId),
    );

    const coursePlans = scoped.lessonPlans.filter((plan) => courseIds.has(plan.courseId));

    for (const plan of coursePlans) {
      sortOrder += 1;
      upsertItem(map, {
        printKey: printKeyLessonPlanNotes(student.id, plan.id),
        studentId: student.id,
        studentName: student.name,
        itemKind: "lesson_plan_notes",
        id: plan.id,
        courseId: plan.courseId,
        courseTitle: plan.courseTitle,
        title: plan.title,
        contextLabels: ["Lesson plan"],
        categories: ["lesson_plan_notes"],
        lessonPlanId: plan.id,
        body: lessonPlanPrintBody(plan),
        sortOrder,
      });

      for (const day of plan.days) {
        for (const linked of day.materials) {
          sortOrder += 1;
          const printKey = printKeyMaterial(student.id, linked.id);
          upsertItem(map, {
            printKey,
            studentId: student.id,
            studentName: student.name,
            itemKind: "material",
            id: linked.id,
            courseId: plan.courseId,
            courseTitle: plan.courseTitle,
            title: linked.title,
            contextLabels: ["On lesson plan"],
            categories: ["lesson_plan_material"],
            lessonPlanId: plan.id,
            sortOrder,
          });
        }
      }
    }

    for (const item of scoped.importantNow) {
      if (!courseIds.has(item.courseId)) continue;
      sortOrder += 1;
      const courseTitle = courseTitleForStudent(student, item.courseId, item.courseTitle);
      upsertItem(map, {
        printKey: printKeyMaterial(student.id, item.materialId),
        studentId: student.id,
        studentName: student.name,
        itemKind: "material",
        id: item.materialId,
        courseId: item.courseId,
        courseTitle,
        title: item.materialTitle,
        contextLabels: ["Important now"],
        categories: ["important_now"],
        sortOrder,
      });
    }

    for (const course of student.courses) {
      for (const material of course.materials) {
        sortOrder += 1;
        const categories = materialCategories(
          scoped.week,
          material,
          importantNowIds,
        );
        if (categories.length === 0) continue;
        const isQuiz = material.itemKind === "quiz";
        const printKey = isQuiz
          ? printKeyQuiz(student.id, material.id)
          : printKeyMaterial(student.id, material.id);
        upsertItem(map, {
          printKey,
          studentId: student.id,
          studentName: student.name,
          itemKind: isQuiz ? "quiz" : "material",
          id: material.id,
          courseId: course.id,
          courseTitle: course.title,
          title: material.title,
          contextLabels: isQuiz ? ["Quiz"] : [],
          categories,
          sortOrder,
          shareAnswerKeyWithParents: isQuiz
            ? material.shareAnswerKeyWithParents
            : undefined,
        });
      }
    }
  }

  const items = [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    items,
    students: scoped.students.map((student) => ({
      id: student.id,
      name: student.name,
    })),
  };
}

function refSource(item: ThisWeekPrintCatalogItem): ThisWeekPrintRef["source"] {
  if (item.itemKind === "lesson_plan_notes") return "lesson_plan";
  if (item.itemKind === "quiz") return "quiz";
  return "material";
}

function contextLinesForItem(item: ThisWeekPrintCatalogItem): string[] {
  const parts = [item.courseTitle];
  if (item.contextLabels.length > 0) {
    parts.push(item.contextLabels.join(" · "));
  }
  return parts.filter(Boolean);
}

export type ThisWeekPrintSelectionContext = {
  teacherView: boolean;
  viewerIsStudent: boolean;
};

export function catalogItemCanShowQuizKey(
  item: ThisWeekPrintCatalogItem,
  context: ThisWeekPrintSelectionContext,
): boolean {
  if (item.itemKind !== "quiz") return false;
  return canShowAnswerKey({
    teacherView: context.teacherView,
    shareWithParents: item.shareAnswerKeyWithParents ?? false,
    viewerIsStudent: context.viewerIsStudent,
  });
}

export function applyPrintSelection(
  catalog: ThisWeekPrintCatalog,
  options: ThisWeekPrintSelectionOptions,
  context?: ThisWeekPrintSelectionContext,
): ThisWeekPrintRef[] {
  const selected = catalog.items.filter((item) => !options.omittedKeys.has(item.printKey));
  const refs: ThisWeekPrintRef[] = [];
  let itemIndex = 0;

  for (const item of selected) {
    const pageBreakBefore = options.breakKeys.has(item.printKey);
    let sectionKey: string;
    if (!options.studentBreaks) {
      sectionKey = "week-all";
    } else if (!options.pack) {
      sectionKey = `student-${item.studentId}-item-${itemIndex}`;
    } else {
      sectionKey = `student-${item.studentId}`;
    }
    if (pageBreakBefore && options.pack) {
      sectionKey = `${sectionKey}-break-${itemIndex}`;
    }

    const quizKeyMode =
      item.itemKind === "quiz" && context
        ? quizKeyModeForQuiz(
            item.id,
            options.quizKeyModes,
            catalogItemCanShowQuizKey(item, context),
          )
        : undefined;

    refs.push({
      source: refSource(item),
      id: item.id,
      courseId: item.courseId,
      sectionKey,
      sectionTitle: item.studentName,
      contextLines: contextLinesForItem(item),
      title: item.itemKind === "lesson_plan_notes" ? item.title : undefined,
      body: item.itemKind === "lesson_plan_notes" ? item.body : undefined,
      itemKind: item.itemKind === "quiz" ? "quiz" : "material",
      printKey: item.printKey,
      pageBreakBefore,
      quizKeyMode,
    });
    itemIndex += 1;
  }

  return refs;
}

export function defaultThisWeekPrintSelection(): ThisWeekPrintSelectionOptions {
  return {
    omittedKeys: new Set(),
    breakKeys: new Set(),
    pack: true,
    studentBreaks: true,
    quizKeyModes: new Map(),
  };
}

export function catalogItemsForStudent(
  catalog: ThisWeekPrintCatalog,
  studentId: number,
): ThisWeekPrintCatalogItem[] {
  return catalog.items.filter((item) => item.studentId === studentId);
}

export function lessonPlansForStudent(
  dashboard: ParentDashboard,
  studentId: number,
): ParentLessonPlanItem[] {
  const student = dashboard.students.find((row) => row.id === studentId);
  if (!student) return [];
  const courseIds = new Set(student.courses.map((course) => course.id));
  return dashboard.lessonPlans.filter((plan) => courseIds.has(plan.courseId));
}
