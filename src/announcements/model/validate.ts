import {
  parseAnnouncementAudience,
  type AnnouncementAudience,
} from "./audience";

export type AnnouncementDraft = {
  audience: AnnouncementAudience | null;
  courseId: number | null;
  classId: number | null;
  studentId: number | null;
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

export function draftFromSearchParams(params: URLSearchParams): Pick<
  AnnouncementDraft,
  "audience" | "courseId" | "classId" | "studentId"
> {
  const audience = parseAnnouncementAudience(params.get("audience"));
  const courseId = parseOptionalId(params.get("courseId"));
  const classId = parseOptionalId(params.get("classId"));
  const studentId = parseOptionalId(params.get("studentId"));
  if (audience === "course") {
    return { audience, courseId, classId: null, studentId: null };
  }
  if (audience === "class") {
    return { audience, courseId: null, classId, studentId: null };
  }
  if (audience === "student") {
    return { audience, courseId: null, classId: null, studentId };
  }
  return { audience: null, courseId: null, classId: null, studentId: null };
}

export function validateAnnouncementDraft(draft: AnnouncementDraft): string | null {
  if (!draft.audience) return "Choose who this announcement is for.";
  if (draft.audience === "course" && draft.courseId == null) {
    return "Choose a course.";
  }
  if (draft.audience === "class" && draft.classId == null) {
    return "Choose a class.";
  }
  if (draft.audience === "student" && draft.studentId == null) {
    return "Choose a student.";
  }
  if (!draft.title.trim()) return "Add a title so families know what this is.";
  if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
    return "The end date needs to be on or after the start date.";
  }
  return null;
}

export function emptyAnnouncementDraft(): AnnouncementDraft {
  return {
    audience: null,
    courseId: null,
    classId: null,
    studentId: null,
    title: "",
    body: "",
    startDate: "",
    endDate: "",
  };
}
