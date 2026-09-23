import type { BlockKind } from "@/materials/model/blocks";
import type { MaterialKind } from "@/materials/model/kind";
import type { CourseQuizPrintView } from "@/quizzes/model/print";

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
  blocks: PrintBlock[];
  file: PrintFile | null;
};

export type PrintPacket = {
  title: string;
  subtitle: string | null;
  includeAnswerKey?: boolean;
  materials: PrintMaterial[];
  /** Standalone course quiz. Page quiz blocks stay on materials. */
  quizQuestions?: CourseQuizPrintView[];
};

/** Pack same-section materials together; missing keys stay one material per page. */
export function groupPacketSections<T extends { sectionKey?: string }>(
  materials: T[],
): T[][] {
  const sections: T[][] = [];
  for (const material of materials) {
    const last = sections[sections.length - 1];
    const key = material.sectionKey;
    if (key && last?.[0]?.sectionKey === key) {
      last.push(material);
    } else {
      sections.push([material]);
    }
  }
  return sections;
}
