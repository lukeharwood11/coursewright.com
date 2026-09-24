import {
  fileSignedUrl,
  uploadNewFile,
  type FileRecord,
} from "@/materials/databridge/files";
import {
  parseDiscussionAudience,
  type DiscussionAudience,
} from "@/discussions/model/audience";
import type { DiscussionDraft } from "@/discussions/model/validate";
import { requireSupabase } from "./client";
import { loadFamilyStudentIds } from "@/parent/databridge/dashboard";

export type DiscussionRecord = {
  id: number;
  organizationId: number;
  audience: DiscussionAudience;
  courseId: number | null;
  classId: number | null;
  title: string;
  createdBy: string;
  authorName: string;
  lastMessageAt: string;
  answeredAt: string | null;
  createdAt: string;
  deletedAt: string | null;
  courseTitle: string | null;
  classTitle: string | null;
  lastReadAt: string | null;
  hasVisibleMessages: boolean;
};

export type DiscussionAttachmentRecord = {
  id: number;
  kind: "file" | "material" | "url";
  fileId: number | null;
  materialId: number | null;
  url: string | null;
  label: string;
  position: number;
  file: FileRecord | null;
  fileUrl: string | null;
  fileDownloadUrl: string | null;
  material: {
    id: number;
    title: string;
    courseId: number;
    unitId: number | null;
  } | null;
};

export type DiscussionMessageRecord = {
  id: number;
  discussionId: number;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  attachments: DiscussionAttachmentRecord[];
};

export type DiscussionDetail = DiscussionRecord & {
  messages: DiscussionMessageRecord[];
};

export type ParentDiscussionContext = {
  students: Array<{ id: number; name: string }>;
  enrollments: Array<{ studentId: number; courseId: number }>;
  classMembers: Array<{ studentId: number; classId: number }>;
};

export type AttachableMaterial = {
  id: number;
  title: string;
  courseId: number;
  unitId: number | null;
  courseTitle: string;
};

export type AttachmentInsert = {
  kind: "file" | "material" | "url";
  fileId?: number | null;
  materialId?: number | null;
  url?: string | null;
  label?: string;
};

const DISCUSSION_COLUMNS =
  "id, organization_id, audience, course_id, class_id, title, created_by, last_message_at, answered_at, created_at, deleted_at";

const DISCUSSION_LIST_EMBED = `${DISCUSSION_COLUMNS}, author:profiles!discussions_created_by_fkey(name), course:courses!discussions_course_id_fkey(title), class:classes!discussions_class_id_fkey(title), discussion_reads(user_id, last_read_at), discussion_messages(id, deleted_at)`;

const MESSAGE_EMBED =
  "id, discussion_id, author_id, body, created_at, updated_at, deleted_at, author:profiles!discussion_messages_author_id_fkey(name), attachments:discussion_message_attachments(id, kind, file_id, material_id, url, label, position, file:files(id, organization_id, filename, storage_ref, mime_type, size_bytes, current_version), material:materials(id, title, course_id, unit_id))";

type ProfileName = { name: string } | { name: string }[] | null | undefined;

type DiscussionRow = {
  id: number;
  organization_id: number;
  audience: string;
  course_id: number | null;
  class_id: number | null;
  title: string;
  created_by: string;
  last_message_at: string;
  answered_at: string | null;
  created_at: string;
  deleted_at: string | null;
  author?: ProfileName;
  course?: { title: string } | { title: string }[] | null;
  class?: { title: string } | { title: string }[] | null;
  discussion_reads?: Array<{ user_id: string; last_read_at: string }> | null;
  discussion_messages?: Array<{ id: number; deleted_at: string | null }> | null;
};

type FileEmbed = {
  id: number;
  organization_id: number;
  filename: string;
  storage_ref: string;
  mime_type: string;
  size_bytes: number;
  current_version: number;
};

type AttachmentRow = {
  id: number;
  kind: string;
  file_id: number | null;
  material_id: number | null;
  url: string | null;
  label: string;
  position: number;
  file?: FileEmbed | FileEmbed[] | null;
  material?:
    | { id: number; title: string; course_id: number | null; unit_id: number | null }
    | Array<{ id: number; title: string; course_id: number | null; unit_id: number | null }>
    | null;
};

type MessageRow = {
  id: number;
  discussion_id: number;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author?: ProfileName;
  attachments?: AttachmentRow[] | null;
};

export const discussionQueryKeys = {
  org: (organizationId: number, userId: string) =>
    ["discussions", "org", organizationId, userId] as const,
  detail: (id: number, userId: string) =>
    ["discussions", "detail", id, userId] as const,
  materials: (organizationId: number, courseId: number | null) =>
    ["discussions", "materials", organizationId, courseId] as const,
  parentContext: (organizationId: number, userId: string) =>
    ["discussions", "parentContext", organizationId, userId] as const,
  members: (discussionId: number) =>
    ["discussions", "members", discussionId] as const,
  audienceMembers: (
    organizationId: number,
    audience: string | null,
    courseId: number | null,
    classId: number | null,
  ) =>
    [
      "discussions",
      "audienceMembers",
      organizationId,
      audience,
      courseId,
      classId,
    ] as const,
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function authorNameFrom(author: ProfileName): string {
  const profile = one(author);
  const name = profile?.name?.trim();
  return name || "Someone";
}

function titleFrom(
  value: { title: string } | { title: string }[] | null | undefined,
): string | null {
  const row = one(value);
  const title = row?.title?.trim();
  return title || null;
}

function toFileRecord(row: FileEmbed): FileRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    filename: row.filename,
    storageRef: row.storage_ref,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    currentVersion: row.current_version,
  };
}

function toDiscussion(row: DiscussionRow, userId?: string): DiscussionRecord | null {
  const audience = parseDiscussionAudience(row.audience);
  if (!audience) return null;
  const reads = Array.isArray(row.discussion_reads) ? row.discussion_reads : [];
  const lastReadAt = userId
    ? (reads.find((entry) => entry.user_id === userId)?.last_read_at ?? null)
    : (reads[0]?.last_read_at ?? null);
  const messages = Array.isArray(row.discussion_messages)
    ? row.discussion_messages
    : [];
  return {
    id: row.id,
    organizationId: row.organization_id,
    audience,
    courseId: row.course_id,
    classId: row.class_id,
    title: row.title,
    createdBy: row.created_by,
    authorName: authorNameFrom(row.author),
    lastMessageAt: row.last_message_at,
    answeredAt: row.answered_at,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    courseTitle: titleFrom(row.course),
    classTitle: titleFrom(row.class),
    lastReadAt,
    hasVisibleMessages: messages.some((message) => message.deleted_at == null),
  };
}

function parseAttachmentKind(value: string): "file" | "material" | "url" | null {
  if (value === "file" || value === "material" || value === "url") return value;
  return null;
}

function toAttachment(row: AttachmentRow): DiscussionAttachmentRecord | null {
  const kind = parseAttachmentKind(row.kind);
  if (!kind) return null;
  const fileRow = one(row.file);
  const materialRow = one(row.material);
  return {
    id: row.id,
    kind,
    fileId: row.file_id,
    materialId: row.material_id,
    url: row.url,
    label: row.label ?? "",
    position: row.position,
    file: fileRow ? toFileRecord(fileRow) : null,
    fileUrl: null,
    fileDownloadUrl: null,
    material:
      materialRow && materialRow.course_id != null
        ? {
            id: materialRow.id,
            title: materialRow.title,
            courseId: materialRow.course_id,
            unitId: materialRow.unit_id,
          }
        : null,
  };
}

function toMessage(row: MessageRow): DiscussionMessageRecord {
  const attachments = (row.attachments ?? [])
    .flatMap((attachment) => {
      const mapped = toAttachment(attachment);
      return mapped ? [mapped] : [];
    })
    .sort((a, b) => a.position - b.position || a.id - b.id);
  return {
    id: row.id,
    discussionId: row.discussion_id,
    authorId: row.author_id,
    authorName: authorNameFrom(row.author),
    body: row.body ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    attachments,
  };
}

async function withSignedUrls(
  messages: DiscussionMessageRecord[],
): Promise<DiscussionMessageRecord[]> {
  return Promise.all(
    messages.map(async (message) => ({
      ...message,
      attachments: await Promise.all(
        message.attachments.map(async (attachment) => {
          if (attachment.kind !== "file" || !attachment.file) return attachment;
          try {
            const [fileUrl, fileDownloadUrl] = await Promise.all([
              fileSignedUrl(attachment.file.storageRef),
              fileSignedUrl(attachment.file.storageRef, {
                download: attachment.file.filename,
              }),
            ]);
            return { ...attachment, fileUrl, fileDownloadUrl };
          } catch {
            return attachment;
          }
        }),
      ),
    })),
  );
}

export async function listDiscussionsForOrganization(
  organizationId: number,
  userId: string,
): Promise<DiscussionRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("discussions")
    .select(DISCUSSION_LIST_EMBED)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .eq("discussion_reads.user_id", userId)
    .order("last_message_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const mapped = toDiscussion(row as DiscussionRow, userId);
    return mapped ? [mapped] : [];
  });
}

export async function getDiscussion(
  id: number,
  userId: string,
): Promise<DiscussionDetail | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("discussions")
    .select(DISCUSSION_LIST_EMBED)
    .eq("id", id)
    .eq("discussion_reads.user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const discussion = toDiscussion(data as DiscussionRow, userId);
  if (!discussion) return null;

  const { data: messageRows, error: messageError } = await db
    .from("discussion_messages")
    .select(MESSAGE_EMBED)
    .eq("discussion_id", id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (messageError) throw new Error(messageError.message);
  const messages = await withSignedUrls(
    (messageRows ?? []).map((row) => toMessage(row as MessageRow)),
  );

  return { ...discussion, messages };
}

export async function createDiscussion(args: {
  organizationId: number;
  createdBy: string;
  draft: DiscussionDraft;
  attachments: AttachmentInsert[];
  notifyAll?: boolean;
  mentionedUserIds?: string[];
}): Promise<DiscussionRecord> {
  const audience = args.draft.audience;
  if (!audience) throw new Error("Choose a course or a class.");
  const db = requireSupabase();
  const { data, error } = await db
    .from("discussions")
    .insert({
      organization_id: args.organizationId,
      audience,
      course_id: audience === "course" ? args.draft.courseId : null,
      class_id: audience === "class" ? args.draft.classId : null,
      title: args.draft.title.trim(),
      created_by: args.createdBy,
      notify_all: args.notifyAll === true,
    })
    .select(DISCUSSION_LIST_EMBED)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("The discussion was created but couldn’t be opened yet.");

  const discussion = toDiscussion(data as DiscussionRow, args.createdBy);
  if (!discussion) {
    throw new Error("The discussion was created but couldn’t be opened yet.");
  }

  try {
    await createDiscussionMessage({
      discussionId: discussion.id,
      authorId: args.createdBy,
      body: args.draft.body,
      attachments: args.attachments,
      mentionedUserIds: args.mentionedUserIds,
    });
  } catch (cause) {
    try {
      await softDeleteDiscussion(discussion.id, args.createdBy);
    } catch {
      // Keep the original post error.
    }
    throw cause instanceof Error
      ? cause
      : new Error("Couldn’t post the first message.");
  }

  return { ...discussion, hasVisibleMessages: true };
}

export async function createDiscussionMessage(args: {
  discussionId: number;
  authorId: string;
  body: string;
  attachments: AttachmentInsert[];
  mentionedUserIds?: string[];
}): Promise<void> {
  const db = requireSupabase();
  // One RPC so @mentions and class-lead/instructor post fan-out share a
  // transaction — mentioned people get one Activity row, not a post + mention.
  const mentionIds = uniqueMentionIds(args.mentionedUserIds, args.authorId);
  const { data, error } = await db.rpc("post_discussion_message", {
    p_discussion_id: args.discussionId,
    p_body: args.body,
    p_mentioned_user_ids: mentionIds,
  });

  if (error) throw new Error(error.message);
  const messageId = typeof data === "number" ? data : Number(data);
  if (!Number.isFinite(messageId) || messageId <= 0) {
    throw new Error("The message was posted but couldn’t be opened yet.");
  }

  if (args.attachments.length === 0) return;

  const rows = args.attachments.map((attachment, index) => ({
    message_id: messageId,
    kind: attachment.kind,
    file_id: attachment.kind === "file" ? (attachment.fileId ?? null) : null,
    material_id:
      attachment.kind === "material" ? (attachment.materialId ?? null) : null,
    url: attachment.kind === "url" ? (attachment.url?.trim() ?? null) : null,
    label: attachment.label?.trim() ?? "",
    position: index,
  }));

  const { error: attachmentError } = await db
    .from("discussion_message_attachments")
    .insert(rows);

  if (attachmentError) {
    const trimmed = args.body.trim();
    const looksEmpty =
      !trimmed ||
      trimmed === '{"v":1,"format":"plain","text":""}' ||
      (trimmed.startsWith("{") && /"text"\s*:\s*""/.test(trimmed) && !/"quote"/.test(trimmed));
    if (looksEmpty) {
      await db
        .from("discussion_messages")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: args.authorId,
        })
        .eq("id", messageId);
    }
    throw new Error(attachmentError.message);
  }
}

export async function setDiscussionAnswered(args: {
  discussionId: number;
  answered: boolean;
  userId: string;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("discussions")
    .update(
      args.answered
        ? { answered_at: new Date().toISOString(), answered_by: args.userId }
        : { answered_at: null, answered_by: null },
    )
    .eq("id", args.discussionId);
  if (error) throw new Error(error.message);
}

export async function softDeleteDiscussion(
  discussionId: number,
  deletedBy: string,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("discussions")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    })
    .eq("id", discussionId);
  if (error) throw new Error(error.message);
}

export async function softDeleteDiscussionMessage(
  messageId: number,
  deletedBy: string,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("discussion_messages")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    })
    .eq("id", messageId);
  if (error) throw new Error(error.message);
}

export async function updateDiscussionMessageBody(args: {
  messageId: number;
  authorId: string;
  body: string;
  mentionedUserIds?: string[];
}): Promise<void> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("discussion_messages")
    .update({ body: args.body })
    .eq("id", args.messageId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error("That message couldn’t be updated. Refresh and try again.");
  }
  await insertMessageMentions({
    messageId: args.messageId,
    authorId: args.authorId,
    mentionedUserIds: args.mentionedUserIds,
  });
}

export async function markDiscussionRead(
  discussionId: number,
  userId: string,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("discussion_reads").upsert(
    {
      discussion_id: discussionId,
      user_id: userId,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "discussion_id,user_id" },
  );
  if (error) throw new Error(error.message);
}

export async function listCourseIdsTaughtBy(userId: string): Promise<number[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("course_instructors")
    .select("course_id")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.course_id);
}

export async function listParentDiscussionContext(
  organizationId: number,
  userId: string,
): Promise<ParentDiscussionContext> {
  const db = requireSupabase();
  const studentIds = await loadFamilyStudentIds(organizationId, userId);
  if (studentIds.length === 0) {
    return { students: [], enrollments: [], classMembers: [] };
  }

  const [studentsResult, enrollmentsResult, membersResult] = await Promise.all([
    db
      .from("student_profiles")
      .select("id, name")
      .eq("organization_id", organizationId)
      .in("id", studentIds)
      .order("name"),
    db
      .from("enrollments")
      .select(
        "student_profile_id, status, course:courses(id, status, visibility, organization_id)",
      )
      .eq("status", "active")
      .in("student_profile_id", studentIds),
    db
      .from("class_members")
      .select("class_id, student_profile_id, class:classes(organization_id, deleted_at)")
      .in("student_profile_id", studentIds),
  ]);

  if (studentsResult.error) throw new Error(studentsResult.error.message);
  if (enrollmentsResult.error) throw new Error(enrollmentsResult.error.message);
  if (membersResult.error) throw new Error(membersResult.error.message);

  const enrollments = (enrollmentsResult.data ?? []).flatMap((row) => {
    const course = one(row.course);
    if (!course || course.organization_id !== organizationId) return [];
    if (course.status !== "active" || course.visibility !== "published") return [];
    return [{ studentId: row.student_profile_id, courseId: course.id }];
  });

  const classMembers = (membersResult.data ?? []).flatMap((row) => {
    const classGroup = one(row.class);
    if (!classGroup || classGroup.organization_id !== organizationId) return [];
    if (classGroup.deleted_at != null) return [];
    return [{ studentId: row.student_profile_id, classId: row.class_id }];
  });

  return {
    students: (studentsResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
    })),
    enrollments,
    classMembers,
  };
}

export async function listAttachableMaterials(args: {
  organizationId: number;
  courseId?: number | null;
}): Promise<AttachableMaterial[]> {
  const db = requireSupabase();
  let query = db
    .from("materials")
    .select("id, title, course_id, unit_id, course:courses(title)")
    .eq("organization_id", args.organizationId)
    .eq("visibility", "published")
    .is("deleted_at", null)
    .order("title");

  if (args.courseId != null) {
    query = query.eq("course_id", args.courseId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    if (row.course_id == null) return [];
    const course = one(row.course);
    return [
      {
        id: row.id,
        title: row.title,
        courseId: row.course_id,
        unitId: row.unit_id,
        courseTitle: course?.title?.trim() || "Course",
      },
    ];
  });
}

export async function uploadDiscussionFile(args: {
  organizationId: number;
  uploadedBy: string;
  file: File;
}): Promise<FileRecord> {
  return uploadNewFile(args);
}

export type DiscussionMemberRecord = {
  userId: string;
  name: string;
  role: string;
};

export async function listDiscussionMembers(
  discussionId: number,
): Promise<DiscussionMemberRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("list_discussion_members", {
    p_discussion_id: discussionId,
  });
  if (error) throw new Error(error.message);

  return (data ?? []).map(toMember);
}

export async function listDiscussionAudienceMembers(args: {
  organizationId: number;
  audience: DiscussionAudience;
  courseId: number | null;
  classId: number | null;
}): Promise<DiscussionMemberRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("list_discussion_audience_members", {
    p_organization_id: args.organizationId,
    p_audience: args.audience,
    p_course_id: args.courseId,
    p_class_id: args.classId,
  });
  if (error) throw new Error(error.message);

  return (data ?? []).map(toMember);
}

function toMember(row: {
  user_id: string;
  name: string | null;
  role: string;
}): DiscussionMemberRecord {
  return {
    userId: row.user_id,
    name: row.name?.trim() || "Someone",
    role: row.role,
  };
}

function uniqueMentionIds(
  userIds: string[] | undefined,
  authorId: string,
): string[] {
  if (!userIds || userIds.length === 0) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const userId of userIds) {
    if (!userId || userId === authorId || seen.has(userId)) continue;
    seen.add(userId);
    ids.push(userId);
  }
  return ids;
}

async function insertMessageMentions(args: {
  messageId: number;
  authorId: string;
  mentionedUserIds?: string[];
}): Promise<void> {
  const mentionIds = uniqueMentionIds(args.mentionedUserIds, args.authorId);
  if (mentionIds.length === 0) return;
  const db = requireSupabase();
  const { error } = await db.from("discussion_message_mentions").upsert(
    mentionIds.map((userId) => ({
      message_id: args.messageId,
      user_id: userId,
    })),
    { onConflict: "message_id,user_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);
}
