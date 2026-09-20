import {
  parseDiscussionAudience,
  type DiscussionAudience,
} from "./audience";

export type DiscussionDraft = {
  audience: DiscussionAudience | null;
  courseId: number | null;
  classId: number | null;
  title: string;
  body: string;
};

export type UrlAttachmentDraft = {
  kind: "url";
  url: string;
  label: string;
};

export type MaterialAttachmentDraft = {
  kind: "material";
  materialId: number;
  label: string;
};

export type FileAttachmentMeta = {
  kind: "file";
  label: string;
};

export type AttachmentContent =
  | UrlAttachmentDraft
  | MaterialAttachmentDraft
  | FileAttachmentMeta;

export function parseOptionalId(value: string | null | undefined): number | null {
  if (!value) return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function draftFromSearchParams(params: URLSearchParams): Pick<
  DiscussionDraft,
  "audience" | "courseId" | "classId"
> {
  const audience = parseDiscussionAudience(params.get("audience"));
  const courseId = parseOptionalId(params.get("courseId"));
  const classId = parseOptionalId(params.get("classId"));
  if (audience === "course") {
    return { audience, courseId, classId: null };
  }
  if (audience === "class") {
    return { audience, courseId: null, classId };
  }
  return { audience: null, courseId: null, classId: null };
}

export function emptyDiscussionDraft(): DiscussionDraft {
  return {
    audience: null,
    courseId: null,
    classId: null,
    title: "",
    body: "",
  };
}

export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function messageHasContent(
  body: string,
  attachments: AttachmentContent[],
): boolean {
  return Boolean(body.trim()) || attachments.length > 0;
}

export function validateUrlAttachment(url: string): string | null {
  if (!url.trim()) return "Add a link.";
  if (!isHttpUrl(url)) return "Use a web address that starts with http:// or https://.";
  return null;
}

export function validateDiscussionDraft(
  draft: DiscussionDraft,
  attachments: AttachmentContent[],
): string | null {
  if (!draft.audience) return "Choose a course or a class.";
  if (draft.audience === "course" && draft.courseId == null) {
    return "Choose a course.";
  }
  if (draft.audience === "class" && draft.classId == null) {
    return "Choose a class.";
  }
  if (!draft.title.trim()) return "Add a title so people know what this is about.";
  if (!messageHasContent(draft.body, attachments)) {
    return "Write a first post, or add a file, material, or link.";
  }
  for (const attachment of attachments) {
    if (attachment.kind === "url") {
      const message = validateUrlAttachment(attachment.url);
      if (message) return message;
    }
  }
  return null;
}

export function discussionDraftCanStart(
  draft: DiscussionDraft,
  attachments: AttachmentContent[],
): boolean {
  return validateDiscussionDraft(draft, attachments) == null;
}

export function validatePost(
  body: string,
  attachments: AttachmentContent[],
): string | null {
  if (!messageHasContent(body, attachments)) {
    return "Write a message, or add a file, material, or link.";
  }
  for (const attachment of attachments) {
    if (attachment.kind === "url") {
      const message = validateUrlAttachment(attachment.url);
      if (message) return message;
    }
  }
  return null;
}

export function canMarkDiscussionAnswered(args: {
  userId: string;
  createdBy: string;
  isStaff: boolean;
}): boolean {
  return args.isStaff || args.userId === args.createdBy;
}

export function canRemoveDiscussion(isStaffTeacherView: boolean): boolean {
  return isStaffTeacherView;
}

export function canRemoveMessage(args: {
  userId: string;
  authorId: string;
  isStaffTeacherView: boolean;
}): boolean {
  return args.isStaffTeacherView || args.userId === args.authorId;
}
