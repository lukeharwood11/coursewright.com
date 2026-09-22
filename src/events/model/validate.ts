import { parseEventAudience, type EventAudience } from "./audience";
import { eventEndDate, normalizeTimeInput } from "./schedule";

export type EventDraft = {
  audience: EventAudience;
  courseIds: number[];
  classIds: number[];
  title: string;
  location: string;
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
  materialIds: number[];
};

export function emptyEventDraft(): EventDraft {
  return {
    audience: "course",
    courseIds: [],
    classIds: [],
    title: "",
    location: "",
    startsOn: "",
    endsOn: "",
    startTime: "",
    endTime: "",
    materialIds: [],
  };
}

export function draftFromSearchParams(params: URLSearchParams): Partial<EventDraft> {
  const audience = parseEventAudience(params.get("audience"));
  const courseId = Number(params.get("courseId"));
  const classId = Number(params.get("classId"));
  const date = params.get("date") ?? "";
  const draft: Partial<EventDraft> = {};
  if (audience) draft.audience = audience;
  if (Number.isFinite(courseId) && courseId > 0) {
    draft.audience = "course";
    draft.courseIds = [courseId];
  }
  if (Number.isFinite(classId) && classId > 0) {
    draft.audience = "class";
    draft.classIds = [classId];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) draft.startsOn = date;
  return draft;
}

export function toggleDraftId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

export function sameIdList(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort((a, b) => a - b);
  const sortedRight = [...right].sort((a, b) => a - b);
  return sortedLeft.every((id, index) => id === sortedRight[index]);
}

export function validateEventDraft(draft: EventDraft): string | null {
  if (!draft.title.trim()) return "Add a title.";
  if (!draft.location.trim()) return "Add a location.";
  if (draft.location.trim().length > 200) return "Keep the location under 200 characters.";
  if (draft.audience === "course" && draft.courseIds.length === 0) {
    return "Choose at least one course.";
  }
  if (draft.audience === "class" && draft.classIds.length === 0) {
    return "Choose at least one class.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.startsOn)) return "Choose a start date.";
  if (draft.endsOn && !/^\d{4}-\d{2}-\d{2}$/.test(draft.endsOn)) {
    return "Choose an end date, or leave it blank.";
  }
  if (draft.endsOn && draft.endsOn < draft.startsOn) {
    return "The end date needs to be on or after the start date.";
  }
  const startTime = normalizeTimeInput(draft.startTime);
  const endTime = normalizeTimeInput(draft.endTime);
  if (draft.endTime.trim() && !endTime) return "Enter a valid end time.";
  if (draft.startTime.trim() && !startTime) return "Enter a valid start time.";
  if (endTime && !startTime) return "Add a start time, or clear the end time.";
  const sameDay = eventEndDate(draft.startsOn, draft.endsOn || null) === draft.startsOn;
  if (sameDay && startTime && endTime && endTime < startTime) {
    return "The end time needs to be at or after the start time.";
  }
  return null;
}

export function canEditEventAudience(args: {
  audience: EventAudience;
  courseIds: number[];
  canPickAnyCourse: boolean;
  taughtCourseIds: number[];
  isStaff: boolean;
}): boolean {
  if (!args.isStaff) return false;
  if (args.audience === "class") return true;
  if (args.canPickAnyCourse) return true;
  if (args.courseIds.length === 0) return true;
  return args.courseIds.every((id) => args.taughtCourseIds.includes(id));
}
