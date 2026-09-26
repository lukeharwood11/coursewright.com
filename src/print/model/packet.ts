import type { BlockKind } from "@/materials/model/blocks";
import type { MaterialKind } from "@/materials/model/kind";
import type { CourseQuizPrintView } from "@/quizzes/model/print";
import type { QuizKeyPrintMode } from "./quizKeyPrintMode";

export type PrintBlock = {
  kind: BlockKind;
  body: unknown;
};

export type PrintFile = {
  filename: string;
  mimeType: string;
  bytes: Uint8Array | null;
};

export type PrintMaterial = {
  id: number;
  title: string;
  description: string;
  kind: MaterialKind;
  url: string | null;
  scheduledDate: string | null;
  /** Consecutive materials with the same key share a wrapping page. */
  sectionKey?: string;
  /** Shown once at the start of a packed section (e.g. student name). */
  sectionTitle?: string;
  contextLines?: string[];
  /** Lesson plan in a this-week packet — empty body is OK. */
  itemRole?: "lesson_plan";
  /** Start a new packed section before this material. */
  pageBreakBefore?: boolean;
  blocks: PrintBlock[];
  file: PrintFile | null;
  /** Standalone course quiz rendered on this row. */
  courseQuizQuestions?: CourseQuizPrintView[];
  courseQuizShowsKey?: boolean;
  courseQuizKeyMode?: QuizKeyPrintMode;
};

export type PrintPacket = {
  title: string;
  subtitle: string | null;
  /** Course title shown under a standalone quiz title. */
  courseTitle?: string | null;
  includeAnswerKey?: boolean;
  materials: PrintMaterial[];
  /** Standalone course quiz. Page quiz blocks stay on materials. */
  quizQuestions?: CourseQuizPrintView[];
  quizKeyMode?: QuizKeyPrintMode;
  /** Keyed presentation for standalone quiz when mode is both. */
  quizQuestionsKey?: CourseQuizPrintView[];
};

type SectionedMaterial = {
  sectionKey?: string;
  pageBreakBefore?: boolean;
};

/** Pack same-section materials together; missing keys stay one material per page. */
export function groupPacketSections<T extends SectionedMaterial>(
  materials: T[],
): T[][] {
  const sections: T[][] = [];
  for (const material of materials) {
    const last = sections[sections.length - 1];
    const key = material.sectionKey;
    const canPack =
      key &&
      last?.[0]?.sectionKey === key &&
      !material.pageBreakBefore;
    if (canPack && last) {
      last.push(material);
    } else {
      sections.push([material]);
    }
  }
  return sections;
}
