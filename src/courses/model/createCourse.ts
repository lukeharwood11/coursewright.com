export type CreateCourseInput = {
  title: string;
  description: string;
  location: string;
  subject: string;
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
      startDate,
      endDate,
      gradeLevels: raw.gradeLevels,
      status,
      copiedFromCourseId: raw.copiedFromCourseId,
    },
  };
}

export function validateCourseSettings(raw: {
  title: string;
  description: string;
  location: string;
  subject: string;
  startDate: string;
  endDate: string;
  gradeLevels: string[];
  status: string;
}): CreateCourseParse {
  return validateCreateCourse({ ...raw, copiedFromCourseId: null });
}
