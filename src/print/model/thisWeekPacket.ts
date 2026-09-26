import type { ParentLessonPlanItem } from "@/parent/model/dashboard";
import { weekdayDateLabel } from "@/lesson-plans/model/validate";
import { richTextBody } from "@/materials/model/blocks";
import type { QuizKeyPrintMode } from "./quizKeyPrintMode";
import type { PrintMaterial } from "./packet";
import {
  applyPrintSelection,
  buildThisWeekPrintCatalog,
  defaultThisWeekPrintSelection,
} from "./thisWeekPrintCatalog";
import type { ParentDashboard } from "@/parent/model/dashboard";

export type ThisWeekPrintRef = {
  source: "lesson_plan" | "material" | "quiz";
  id: number;
  courseId: number;
  sectionKey: string;
  sectionTitle: string;
  contextLines: string[];
  title?: string;
  body?: string;
  itemKind?: "material" | "quiz";
  printKey?: string;
  pageBreakBefore?: boolean;
  quizKeyMode?: QuizKeyPrintMode;
};

export function lessonPlanPrintBody(plan: ParentLessonPlanItem): string {
  const parts: string[] = [];
  if (plan.weekNote.trim()) parts.push(plan.weekNote.trim());
  for (const day of plan.days) {
    if (!day.body.trim()) continue;
    parts.push(`${weekdayDateLabel(day.date)}\n${day.body.trim()}`);
  }
  return parts.join("\n\n");
}

/** One student at a time: lesson plans (notes + linked materials), then important now, then this-week work. */
export function thisWeekPrintRefs(
  dashboard: ParentDashboard,
  studentIds?: number[] | null,
): ThisWeekPrintRef[] {
  const catalog = buildThisWeekPrintCatalog(dashboard, studentIds);
  return applyPrintSelection(catalog, defaultThisWeekPrintSelection());
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
