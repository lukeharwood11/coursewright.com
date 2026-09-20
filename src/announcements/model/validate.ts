import {
  parseAnnouncementAudience,
  type AnnouncementAudience,
} from "./audience";

export type AnnouncementDraft = {
  audience: AnnouncementAudience | null;
  courseIds: number[];
  classIds: number[];
  studentIds: number[];
  title: string;
  body: string;
  startDate: string;
  endDate: string;
};

export function parseOptionalId(value: string | null | undefined): number | null {
  if (!value) return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function uniqueIds(ids: number[]): number[] {
  return [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))];
}

export function draftFromSearchParams(params: URLSearchParams): Pick<
  AnnouncementDraft,
  "audience" | "courseIds" | "classIds" | "studentIds"
> {
  const audience = parseAnnouncementAudience(params.get("audience"));
  const courseId = parseOptionalId(params.get("courseId"));
  const classId = parseOptionalId(params.get("classId"));
  const studentId = parseOptionalId(params.get("studentId"));
  if (audience === "course") {
    return {
      audience,
      courseIds: courseId != null ? [courseId] : [],
      classIds: [],
      studentIds: [],
    };
  }
  if (audience === "class") {
    return {
      audience,
      courseIds: [],
      classIds: classId != null ? [classId] : [],
      studentIds: [],
    };
  }
  if (audience === "student") {
    return {
      audience,
      courseIds: [],
      classIds: [],
      studentIds: studentId != null ? [studentId] : [],
    };
  }
  return { audience: null, courseIds: [], classIds: [], studentIds: [] };
}

export function validateAnnouncementDraft(draft: AnnouncementDraft): string | null {
  if (!draft.audience) return "Choose who this announcement is for.";
  if (draft.audience === "course" && draft.courseIds.length === 0) {
    return "Choose at least one course.";
  }
  if (draft.audience === "class" && draft.classIds.length === 0) {
    return "Choose at least one class.";
  }
  if (draft.audience === "student" && draft.studentIds.length === 0) {
    return "Choose at least one student.";
  }
  if (!draft.title.trim()) return "Add a title so families know what this is.";
  if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
    return "The end date needs to be on or after the start date.";
  }
  return null;
}

/** Title plus at least one matching audience target — enough to enable Post. */
export function announcementDraftHasTitleAndTargets(draft: AnnouncementDraft): boolean {
  if (!draft.title.trim() || !draft.audience) return false;
  if (draft.audience === "course") return draft.courseIds.length > 0;
  if (draft.audience === "class") return draft.classIds.length > 0;
  return draft.studentIds.length > 0;
}

export function emptyAnnouncementDraft(): AnnouncementDraft {
  return {
    audience: null,
    courseIds: [],
    classIds: [],
    studentIds: [],
    title: "",
    body: "",
    startDate: "",
    endDate: "",
  };
}

export function toggleDraftId(
  draft: AnnouncementDraft,
  field: "courseIds" | "classIds" | "studentIds",
  id: number,
): AnnouncementDraft {
  const current = draft[field];
  const next = current.includes(id)
    ? current.filter((value) => value !== id)
    : uniqueIds([...current, id]);
  return { ...draft, [field]: next };
}

export function sameIdList(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort((x, y) => x - y);
  const right = [...b].sort((x, y) => x - y);
  return left.every((value, index) => value === right[index]);
}
