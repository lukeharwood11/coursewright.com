import { getCourse } from "@/courses/databridge/courses";
import { getEvent } from "@/events/databridge/events";
import { formatEventWhen } from "@/events/model/schedule";
import { downloadFileBytes, getFile } from "@/materials/databridge/files";
import { listBlocks } from "@/materials/databridge/blocks";
import { listResourceBlocks } from "@/resources/databridge/blocks";
import { getResourceItem } from "@/resources/databridge/items";
import {
  getMaterial,
  listMaterialsForUnit,
} from "@/materials/databridge/materials";
import { familyVisibleMaterials } from "@/app/layouts/model/viewMode";
import { getUnit } from "@/units/databridge/units";
import { mergeOutline } from "@/quizzes/model/outline";
import { listQuizzesForUnit } from "@/quizzes/databridge/quizzes";
import { pushCourseQuizPrintMaterials } from "@/print/model/courseQuizPrintRows";
import {
  defaultQuizKeyPrintMode,
  quizKeyModeForQuiz,
  type QuizKeyPrintMode,
} from "@/print/model/quizKeyPrintMode";
import { loadDashboardForStaffViewMode, loadParentDashboard } from "@/parent/databridge/dashboard";
import {
  thisWeekPrintRefs,
  printMaterialFromLessonPlan,
  type ThisWeekPrintRef,
} from "@/print/model/thisWeekPacket";
import { accountIsStudentOnCourse, canShowAnswerKey } from "@/quizzes/model/quiz";
import { presentCourseQuizPrint } from "@/quizzes/model/print";
import type { PrintMaterial, PrintPacket } from "@/print/model/packet";
import type { CourseQuizPrintSource } from "@/quizzes/model/print";
import {
  getQuiz,
  listLinkedStudents,
  listQuizQuestions,
} from "@/quizzes/databridge/quizzes";

async function toPrintMaterial(
  material: Awaited<ReturnType<typeof getMaterial>>,
): Promise<PrintMaterial | null> {
  if (!material || material.deletedAt) return null;
  const blocks =
    material.kind === "page"
      ? (await listBlocks(material.id)).map((block) => ({
          kind: block.kind,
          body: block.body,
        }))
      : [];
  const file = material.fileId ? await getFile(material.fileId) : null;
  let bytes: Uint8Array | null = null;
  if (file) {
    try {
      bytes = await downloadFileBytes(file.storageRef);
    } catch {
      bytes = null;
    }
  }
  return {
    id: material.id,
    title: material.title,
    description: material.description,
    kind: material.kind,
    url: material.url,
    scheduledDate: material.scheduledDate,
    blocks,
    file: file
      ? {
          filename: file.filename,
          mimeType: file.mimeType,
          bytes,
        }
      : null,
  };
}

export async function loadMaterialPrintPacket(
  materialId: number,
): Promise<PrintPacket | null> {
  const material = await getMaterial(materialId);
  if (!material) return null;
  const course = await getCourse(material.courseId);
  const printed = await toPrintMaterial(material);
  if (!printed) return null;
  return {
    title: printed.title,
    subtitle: course?.title ?? null,
    materials: [printed],
  };
}

async function resourceItemPrintMaterial(
  itemId: number,
): Promise<PrintMaterial | null> {
  const item = await getResourceItem(itemId);
  if (!item || item.archivedAt) return null;
  const kind =
    item.type === "document" ? "page" : item.type === "link" ? "link" : "file";
  const blocks =
    item.type === "document"
      ? (await listResourceBlocks(item.id)).map((block) => ({
          kind: block.kind,
          body: block.body,
        }))
      : [];
  const file = item.fileId ? await getFile(item.fileId) : null;
  let bytes: Uint8Array | null = null;
  if (file) {
    try {
      bytes = await downloadFileBytes(file.storageRef);
    } catch {
      bytes = null;
    }
  }
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    kind,
    url: item.url,
    scheduledDate: null,
    blocks,
    file: file
      ? {
          filename: file.filename,
          mimeType: file.mimeType,
          bytes,
        }
      : null,
  };
}

export async function loadResourcePrintPacket(
  itemIdOrIds: number | number[],
): Promise<PrintPacket | null> {
  const ids = Array.isArray(itemIdOrIds) ? itemIdOrIds : [itemIdOrIds];
  const materials: PrintMaterial[] = [];
  let found = false;
  for (const id of ids) {
    const material = await resourceItemPrintMaterial(id);
    if (!material) continue;
    found = true;
    if (material.kind === "link" && ids.length > 1) continue;
    materials.push(material);
  }
  if (!found) return null;
  const only = materials[0];
  return {
    title: materials.length === 1 && only ? only.title : "Resources",
    subtitle: "Resources",
    materials,
  };
}

export async function loadUnitPrintPacket(args: {
  unitId: number;
  userId: string;
  userEmail: string | null;
  parentPresentation: boolean;
  quizKeyModes?: Map<number, QuizKeyPrintMode>;
}): Promise<PrintPacket | null> {
  const unit = await getUnit(args.unitId);
  if (!unit) return null;
  const course = await getCourse(unit.courseId);
  const materialRows = args.parentPresentation
    ? familyVisibleMaterials(await listMaterialsForUnit(args.unitId))
    : await listMaterialsForUnit(args.unitId);
  const quizRows = args.parentPresentation
    ? familyVisibleMaterials(await listQuizzesForUnit(args.unitId))
    : await listQuizzesForUnit(args.unitId);
  const outline = mergeOutline(materialRows, quizRows);
  const printed: PrintMaterial[] = [];
  const modes = args.quizKeyModes ?? new Map();

  for (const entry of outline) {
    if (entry.kind === "material") {
      const material = materialRows.find((row) => row.id === entry.id);
      if (!material) continue;
      const item = await toPrintMaterial(material);
      if (item) printed.push(item);
      continue;
    }
    const contextLines = course?.title ? [course.title] : [];
    const quizPacket = await loadQuizPrintPacket({ quizId: entry.id, userId: args.userId });
    if (!quizPacket) continue;
    const viewerIsStudent = accountIsStudentOnCourse(
      args.userEmail,
      quizPacket.linkedStudents,
    );
    const canShowKey = canShowAnswerKey({
      teacherView: !args.parentPresentation,
      shareWithParents: quizPacket.shareAnswerKeyWithParents,
      viewerIsStudent,
    });
    const mode = quizKeyModeForQuiz(entry.id, modes, canShowKey);
    const row = {
      id: entry.id,
      title: quizPacket.packet.title,
      description: quizPacket.packet.subtitle ?? "",
      kind: "page" as const,
      url: null,
      scheduledDate: null,
      contextLines,
      blocks: [] as PrintMaterial["blocks"],
      file: null,
    };
    const worksheet = quizPacket.questions.map((question) =>
      presentCourseQuizPrint(question, false),
    );
    const keyed = quizPacket.questions.map((question) =>
      presentCourseQuizPrint(question, true),
    );
    pushCourseQuizPrintMaterials(printed, row, worksheet, keyed, mode);
  }

  return {
    title: unit.title,
    subtitle: course?.title ?? null,
    materials: printed,
  };
}

export async function loadEventPrintPacket(eventId: number): Promise<PrintPacket | null> {
  const event = await getEvent(eventId);
  if (!event) return null;
  const linked =
    event.materials.length > 0
      ? `Materials: ${event.materials.map((material) => material.title).join(", ")}`
      : "";
  const description = [formatEventWhen(event), event.location, linked].filter(Boolean).join("\n");
  return {
    title: event.title,
    subtitle: event.location,
    materials: [
      {
        id: event.id,
        title: event.title,
        description,
        kind: "page",
        url: null,
        scheduledDate: event.startsOn,
        blocks: event.blocks.map((block) => ({ kind: block.kind, body: block.body })),
        file: null,
      },
    ],
  };
}

async function courseQuizPrintMaterials(
  ref: ThisWeekPrintRef,
  userId: string,
  userEmail: string | null,
  parentPresentation: boolean,
): Promise<PrintMaterial[]> {
  const quizPacket = await loadQuizPrintPacket({ quizId: ref.id, userId });
  if (!quizPacket) return [];
  const viewerIsStudent = accountIsStudentOnCourse(
    userEmail,
    quizPacket.linkedStudents,
  );
  const canShowKey = canShowAnswerKey({
    teacherView: !parentPresentation,
    shareWithParents: quizPacket.shareAnswerKeyWithParents,
    viewerIsStudent,
  });
  const mode =
    ref.quizKeyMode ?? defaultQuizKeyPrintMode(canShowKey);
  const effectiveMode = canShowKey ? mode : "worksheet";
  const row = {
    id: ref.id,
    title: quizPacket.packet.title,
    description: quizPacket.packet.subtitle ?? "",
    kind: "page" as const,
    url: null,
    scheduledDate: null,
    contextLines: ref.contextLines,
    sectionKey: ref.sectionKey,
    sectionTitle: ref.sectionTitle,
    pageBreakBefore: ref.pageBreakBefore,
    blocks: [] as PrintMaterial["blocks"],
    file: null,
  };
  const worksheet = quizPacket.questions.map((question) =>
    presentCourseQuizPrint(question, false),
  );
  const keyed = quizPacket.questions.map((question) =>
    presentCourseQuizPrint(question, true),
  );
  const printed: PrintMaterial[] = [];
  pushCourseQuizPrintMaterials(printed, row, worksheet, keyed, effectiveMode);
  return printed;
}

export async function loadWeekPrintPacket(args: {
  organizationId: number;
  userId: string;
  userEmail: string | null;
  parentPresentation: boolean;
  staffViewMode?: "teacher" | "preview" | "parent" | "student";
  studentIds?: number[] | null;
  weekStart?: string | null;
  refs?: ThisWeekPrintRef[];
}): Promise<PrintPacket> {
  const mode = args.staffViewMode ?? "teacher";
  const loadOptions = { weekStart: args.weekStart ?? null };
  const dashboard =
    args.parentPresentation && mode !== "teacher"
      ? await loadDashboardForStaffViewMode(
          args.organizationId,
          args.userId,
          mode,
          "Preview",
          loadOptions,
        )
      : await loadParentDashboard(args.organizationId, args.userId, loadOptions);
  const refs =
    args.refs ?? thisWeekPrintRefs(dashboard, args.studentIds);
  const printed: PrintMaterial[] = [];
  for (const ref of refs) {
    if (ref.source === "lesson_plan") {
      printed.push({
        ...printMaterialFromLessonPlan(ref),
        pageBreakBefore: ref.pageBreakBefore,
      });
      continue;
    }
    if (ref.source === "quiz" || ref.itemKind === "quiz") {
      const quizItems = await courseQuizPrintMaterials(
        ref,
        args.userId,
        args.userEmail,
        args.parentPresentation,
      );
      printed.push(...quizItems);
      continue;
    }
    const material = await getMaterial(ref.id);
    const item = await toPrintMaterial(material);
    if (item) {
      printed.push({
        ...item,
        contextLines: ref.contextLines,
        sectionKey: ref.sectionKey,
        sectionTitle: ref.sectionTitle,
        pageBreakBefore: ref.pageBreakBefore,
      });
    }
  }
  return {
    title: "This week",
    subtitle: dashboard.week.label,
    materials: printed,
  };
}

export async function loadQuizPrintPacket(args: {
  quizId: number;
  userId: string;
}): Promise<{
  packet: Omit<PrintPacket, "quizQuestions">;
  questions: CourseQuizPrintSource[];
  shareAnswerKeyWithParents: boolean;
  linkedStudents: { studentEmail: string | null }[];
} | null> {
  const quiz = await getQuiz(args.quizId);
  if (!quiz) return null;
  const [questions, linkedStudents, course] = await Promise.all([
    listQuizQuestions(args.quizId),
    listLinkedStudents(quiz.courseId, args.userId),
    getCourse(quiz.courseId),
  ]);
  const quizQuestions: CourseQuizPrintSource[] = questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    points: question.points,
    kind: question.kind,
    choices: question.choices.map((choice) => ({
      id: String(choice.id),
      text: choice.text,
      correct: choice.correct,
    })),
    answer: question.answer,
    answerLines: question.answerLines,
    prompts: question.prompts.map((prompt) => ({
      id: prompt.id,
      position: prompt.position,
      text: prompt.text,
    })),
    options: question.options.map((option) => ({
      id: option.id,
      position: option.position,
      text: option.text,
    })),
    matchKeys: question.matchKeys,
  }));
  return {
    packet: {
      title: quiz.title,
      subtitle: quiz.description || null,
      courseTitle: course?.title ?? null,
      materials: [],
    },
    questions: quizQuestions,
    shareAnswerKeyWithParents: quiz.shareAnswerKeyWithParents,
    linkedStudents,
  };
}
