import type { CourseIconValue } from "@/courses/model/courseIcon";
import { parseCourseIconKey } from "@/courses/model/courseIcon";
import {
  parseCourseColorKey,
  type CourseColorKey,
} from "@/courses/model/courseColor";

export type CreateCourseInput = {
  title: string;
  description: string;
  location: string;
  subject: string;
  iconKey: CourseIconValue;
  startDate: string | null;
  endDate: string | null;
  gradeLevels: string[];
  status: "active" | "archived";
  copiedFromCourseId: number | null;
};

export type CreateCourseParse =
  | { ok: true; value: CreateCourseInput }
  | { ok: false; error: string };

export function validateCreateCourse(raw: {
  title: string;
  description: string;
  location: string;
  subject: string;
  iconKey: CourseIconValue;
  startDate: string;
  endDate: string;
  gradeLevels: string[];
  status: string;
  copiedFromCourseId: number | null;
}): CreateCourseParse {
  const title = raw.title.trim();
  if (!title) {
    return { ok: false, error: "Give the course a title." };
  }

  const startDate = raw.startDate.trim() || null;
  const endDate = raw.endDate.trim() || null;
  if (startDate && endDate && endDate < startDate) {
    return { ok: false, error: "End date can’t be before the start date." };
  }

  const status = raw.status === "archived" ? "archived" : "active";

  return {
    ok: true,
    value: {
      title,
      description: raw.description.trim(),
      location: raw.location.trim(),
      subject: raw.subject.trim(),
      iconKey: parseCourseIconKey(raw.iconKey),
      startDate,
      endDate,
      gradeLevels: raw.gradeLevels,
      status,
      copiedFromCourseId: raw.copiedFromCourseId,
    },
  };
}

export type CourseSettingsInput = Omit<CreateCourseInput, "copiedFromCourseId"> & {
  colorKey: CourseColorKey;
};

export type CourseSettingsParse =
  | { ok: true; value: CourseSettingsInput }
  | { ok: false; error: string };

export function validateCourseSettings(raw: {
  title: string;
  description: string;
  location: string;
  subject: string;
  iconKey: CourseIconValue;
  startDate: string;
  endDate: string;
  gradeLevels: string[];
  status: string;
  colorKey: string;
}): CourseSettingsParse {
  const parsed = validateCreateCourse({ ...raw, copiedFromCourseId: null });
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    value: {
      ...parsed.value,
      colorKey: parseCourseColorKey(raw.colorKey),
    },
  };
}

export type CourseSettingsDraft = {
  title: string;
  description: string;
  location: string;
  subject: string;
  iconKey: CourseIconValue;
  startDate: string;
  endDate: string;
  gradeLevels: string[];
  status: string;
  colorKey: CourseColorKey;
};

export type CourseSettingsSaved = {
  title: string;
  description: string;
  location: string;
  subject: string;
  iconKey: CourseIconValue;
  startDate: string | null;
  endDate: string | null;
  gradeLevels: string[];
  status: string;
  colorKey: CourseColorKey;
};

function sameGradeLevels(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((label, index) => label === b[index]);
}

/** True when the draft differs from the saved course settings. */
export function courseSettingsHaveChanges(
  draft: CourseSettingsDraft,
  saved: CourseSettingsSaved,
): boolean {
  if (draft.title.trim() !== saved.title) return true;
  if (draft.description !== saved.description) return true;
  if (draft.location !== saved.location) return true;
  if (draft.subject !== saved.subject) return true;
  if (draft.iconKey !== saved.iconKey) return true;
  if (draft.colorKey !== saved.colorKey) return true;
  if (draft.startDate !== (saved.startDate ?? "")) return true;
  if (draft.endDate !== (saved.endDate ?? "")) return true;
  if (draft.status !== saved.status) return true;
  return !sameGradeLevels(draft.gradeLevels, saved.gradeLevels);
}
