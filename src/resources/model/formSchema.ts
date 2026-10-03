export const FORM_FIELD_KINDS = [
  "short_text",
  "long_text",
  "yes_no",
  "choice",
  "date",
] as const;

export type FormFieldKind = (typeof FORM_FIELD_KINDS)[number];

export const FORM_SUBJECT_MODES = ["none", "optional", "required"] as const;
export type FormSubjectMode = (typeof FORM_SUBJECT_MODES)[number];

export type FormField = {
  id: string;
  label: string;
  kind: FormFieldKind;
  required: boolean;
  options: string[];
};

export type OrgFormSchema = {
  subject: FormSubjectMode;
  fields: FormField[];
};

export type FormAnswerValue = string | boolean;
export type FormAnswers = Record<string, FormAnswerValue>;

const FIELD_ID = /^[A-Za-z0-9_-]{1,40}$/;
const ISO_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export function emptyFormSchema(): OrgFormSchema {
  return { subject: "none", fields: [] };
}

export function newFormFieldId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return `f_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function formFieldKindLabel(kind: FormFieldKind): string {
  if (kind === "short_text") return "Short answer";
  if (kind === "long_text") return "Long answer";
  if (kind === "yes_no") return "Yes or no";
  if (kind === "choice") return "Choice";
  return "Date";
}

export function blankFormField(): FormField {
  return {
    id: newFormFieldId(),
    label: "",
    kind: "short_text",
    required: false,
    options: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseSubject(value: unknown): FormSubjectMode {
  return value === "optional" || value === "required" ? value : "none";
}

function parseField(value: unknown): FormField | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || !FIELD_ID.test(value.id)) return null;
  if (typeof value.label !== "string") return null;
  if (typeof value.kind !== "string" || !FORM_FIELD_KINDS.includes(value.kind as FormFieldKind)) {
    return null;
  }
  const kind = value.kind as FormFieldKind;
  const options = Array.isArray(value.options)
    ? value.options.filter((option): option is string => typeof option === "string")
    : [];
  return {
    id: value.id,
    label: value.label,
    kind,
    required: value.required === true,
    options: kind === "choice" ? options : [],
  };
}

/** Best-effort read of schema_json. Invalid questions are dropped. */
export function parseFormSchema(value: unknown): OrgFormSchema {
  if (!isRecord(value)) return emptyFormSchema();
  const rawFields = Array.isArray(value.fields) ? value.fields : [];
  const fields: FormField[] = [];
  const seen = new Set<string>();
  for (const raw of rawFields) {
    const field = parseField(raw);
    if (!field || seen.has(field.id)) continue;
    seen.add(field.id);
    fields.push(field);
  }
  return { subject: parseSubject(value.subject), fields: fields.slice(0, 40) };
}

export function validateFormSchema(schema: OrgFormSchema): string | null {
  if (!FORM_SUBJECT_MODES.includes(schema.subject)) {
    return "Choose whether this form asks for a student.";
  }
  if (schema.fields.length > 40) return "A form can have at most 40 questions.";
  const seen = new Set<string>();
  for (const field of schema.fields) {
    if (!FIELD_ID.test(field.id)) return "Each question needs a short id.";
    if (seen.has(field.id)) return "Each question id must be unique.";
    seen.add(field.id);
    const label = field.label.trim();
    if (!label) return "Name every question.";
    if (label.length > 200) return "Question names must be 200 characters or fewer.";
    if (!FORM_FIELD_KINDS.includes(field.kind)) return "That question type isn’t supported.";
    if (field.kind === "choice") {
      const options = field.options.map((option) => option.trim()).filter(Boolean);
      if (options.length < 1 || options.length > 12) {
        return "A choice question needs 1 to 12 options.";
      }
      if (options.some((option) => option.length > 200)) {
        return "Each option must be 200 characters or fewer.";
      }
      if (new Set(options).size !== options.length) return "Options on a question must be different.";
    }
  }
  return null;
}

/** Persistable schema. Trims labels and drops blank options. */
export function normalizeFormSchema(schema: OrgFormSchema): OrgFormSchema {
  return {
    subject: schema.subject,
    fields: schema.fields.map((field) => ({
      id: field.id,
      label: field.label.trim(),
      kind: field.kind,
      required: field.required,
      options:
        field.kind === "choice"
          ? field.options.map((option) => option.trim()).filter(Boolean)
          : [],
    })),
  };
}

export function validateFormAnswers(args: {
  schema: OrgFormSchema;
  answers: FormAnswers;
  subjectStudentId: number | null;
}): string | null {
  if (args.schema.subject === "none" && args.subjectStudentId != null) {
    return "This form doesn’t ask for a student.";
  }
  if (args.schema.subject === "required" && args.subjectStudentId == null) {
    return "Choose a student.";
  }
  if (args.schema.fields.length === 0 && args.schema.subject === "none") {
    return "This form has nothing to fill in.";
  }
  for (const field of args.schema.fields) {
    const value = args.answers[field.id];
    const empty =
      value == null ||
      value === "" ||
      (typeof value === "string" && !value.trim());
    if (field.required && empty) return "Answer every required question.";
    if (empty) continue;
    if (field.kind === "yes_no" && typeof value !== "boolean") return "Answer yes or no.";
    if (field.kind !== "yes_no" && typeof value !== "string") {
      return "That answer doesn’t match the question.";
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (field.kind === "short_text" && trimmed.length > 500) {
        return "A short answer must be 500 characters or fewer.";
      }
      if (field.kind === "long_text" && trimmed.length > 8000) {
        return "A long answer must be 8000 characters or fewer.";
      }
      if (field.kind === "date" && !ISO_DATE.test(trimmed)) return "Use a date.";
      if (field.kind === "choice" && !field.options.includes(trimmed)) {
        return "Choose one of the listed options.";
      }
    }
  }
  return null;
}

export function formAnswersPayload(
  schema: OrgFormSchema,
  answers: FormAnswers,
): Record<string, FormAnswerValue> {
  const payload: Record<string, FormAnswerValue> = {};
  for (const field of schema.fields) {
    const value = answers[field.id];
    if (value == null || value === "") continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      payload[field.id] = trimmed;
    } else {
      payload[field.id] = value;
    }
  }
  return payload;
}

export function formatFormAnswer(field: FormField, value: unknown): string {
  if (value == null || value === "") return "—";
  if (field.kind === "yes_no") {
    if (value === true) return "Yes";
    if (value === false) return "No";
  }
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "—";
}
