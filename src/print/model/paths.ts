import {
  buildQuizPrintKeySearch,
  parseQuizKeyModeMap,
  parseQuizPrintKeySearch,
  serializeQuizKeyModeMap,
  type QuizKeyPrintMode,
} from "./quizKeyPrintMode";
import type { ThisWeekPrintSelectionOptions } from "./thisWeekPrintCatalog";
import { parseOrgHomeWeekParam } from "@/parent/model/orgHomeWeek";

export type ThisWeekPrintUrlOptions = {
  studentIds: number[] | null;
  weekStart: string | null;
  selection: ThisWeekPrintSelectionOptions;
};

function parseCommaList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseThisWeekPrintSearch(search: string): ThisWeekPrintUrlOptions {
  const params = new URLSearchParams(search);
  const studentRaw = params.get("students");
  const studentIds = studentRaw
    ? studentRaw
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0)
    : null;
  const omit = new Set(parseCommaList(params.get("omit")));
  const breakKeys = new Set(parseCommaList(params.get("break")));
  const pack = params.get("pack") !== "0";
  const studentBreaks = params.get("studentBreaks") !== "0";
  const quizKeyModes = parseQuizKeyModeMap(params.get("qid"));
  const weekStart = parseOrgHomeWeekParam(params.get("week"));
  return {
    studentIds: studentIds && studentIds.length > 0 ? studentIds : null,
    weekStart,
    selection: {
      omittedKeys: omit,
      breakKeys,
      pack,
      studentBreaks,
      quizKeyModes,
    },
  };
}

export function buildThisWeekPrintSearch(input: {
  studentIds?: number[] | null;
  weekStart?: string | null;
  selection: ThisWeekPrintSelectionOptions;
}): string {
  const params = new URLSearchParams();
  if (input.studentIds && input.studentIds.length > 0) {
    params.set("students", input.studentIds.join(","));
  }
  const week = parseOrgHomeWeekParam(input.weekStart ?? null);
  if (week) params.set("week", week);
  const omit = [...input.selection.omittedKeys].sort();
  if (omit.length > 0) params.set("omit", omit.join(","));
  const breaks = [...input.selection.breakKeys].sort();
  if (breaks.length > 0) params.set("break", breaks.join(","));
  if (!input.selection.pack) params.set("pack", "0");
  if (!input.selection.studentBreaks) params.set("studentBreaks", "0");
  const qid = serializeQuizKeyModeMap(input.selection.quizKeyModes);
  if (qid) params.set("qid", qid);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function parseUnitPrintSearch(search: string): Map<number, QuizKeyPrintMode> {
  const params = new URLSearchParams(search);
  return parseQuizKeyModeMap(params.get("qid"));
}

export function buildUnitPrintSearch(quizKeyModes: Map<number, QuizKeyPrintMode>): string {
  const qid = serializeQuizKeyModeMap(quizKeyModes);
  if (!qid) return "";
  return `?qid=${qid}`;
}

export { parseQuizPrintKeySearch, buildQuizPrintKeySearch };

export function printThisWeekPath(
  orgSlug: string,
  studentIds?: number[],
  selection?: ThisWeekPrintSelectionOptions,
  options?: { weekStart?: string | null },
): string {
  const path = `/my/${orgSlug}/print-this-week`;
  const search = buildThisWeekPrintSearch({
    studentIds: studentIds ?? null,
    weekStart: options?.weekStart ?? null,
    selection: selection ?? {
      omittedKeys: new Set(),
      breakKeys: new Set(),
      pack: true,
      studentBreaks: true,
      quizKeyModes: new Map(),
    },
  });
  return `${path}${search}`;
}

export function parsePrintStudentIds(search: string): number[] | null {
  return parseThisWeekPrintSearch(search).studentIds;
}

export type PrintGrainKind = "material" | "unit" | "thisWeek" | "resource" | "event" | "quiz";

export function printBackPath(input: {
  grain: PrintGrainKind | null;
  orgSlug: string;
  courseId: number | null;
  unitId: number | null;
  materialId: number | null;
  itemId?: number | null;
  eventId?: number | null;
  quizId?: number | null;
}): string {
  if (input.grain === "quiz" && input.courseId && input.unitId && input.quizId) {
    return `/my/${input.orgSlug}/courses/${input.courseId}/units/${input.unitId}/quizzes/${input.quizId}`;
  }
  if (input.grain === "event" && input.eventId) {
    return `/my/${input.orgSlug}/events/${input.eventId}`;
  }
  if (input.grain === "resource") {
    if (input.itemId) {
      return `/my/${input.orgSlug}/resources/items/${input.itemId}`;
    }
    return `/my/${input.orgSlug}/resources`;
  }
  if (input.grain === "material" && input.courseId && input.materialId) {
    const nested = input.unitId
      ? `/my/${input.orgSlug}/courses/${input.courseId}/units/${input.unitId}/materials/${input.materialId}`
      : `/my/${input.orgSlug}/courses/${input.courseId}/materials/${input.materialId}`;
    return nested;
  }
  if (input.grain === "unit" && input.courseId && input.unitId) {
    return `/my/${input.orgSlug}/courses/${input.courseId}/units/${input.unitId}`;
  }
  return `/my/${input.orgSlug}`;
}

export function printFilename(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug || "print"}.pdf`;
}
