import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import { isStaffRole } from "@/organizations/model/role";
import {
  createDiscussionMessage,
  discussionQueryKeys,
  getDiscussion,
  listAttachableMaterials,
  markDiscussionRead,
  setDiscussionAnswered,
  softDeleteDiscussion,
  softDeleteDiscussionMessage,
  uploadDiscussionFile,
  type DiscussionMessageRecord,
} from "@/discussions/databridge/discussions";
import { subscribeToDiscussionThread } from "@/discussions/databridge/realtime";
import { nestDiscussionMessages } from "@/discussions/model/thread";
import {
  canMarkDiscussionAnswered,
  canRemoveDiscussion,
  canRemoveMessage,
  validatePost,
  type AttachmentContent,
} from "@/discussions/model/validate";
import type { PendingAttachment } from "../components/MessageComposer";

export function useDiscussion() {
  const params = useParams();
  const discussionId = params.discussionId ? Number(params.discussionId) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const canEdit = staffCanEdit(role, parentPresentation);
  const isStaff = role ? isStaffRole(role) : false;

  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [replyTo, setReplyTo] = useState<DiscussionMessageRecord | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const markedReadFor = useRef<string | null>(null);

  const discussionQuery = useQuery({
    queryKey: discussionQueryKeys.detail(discussionId, user.id),
    queryFn: () => getDiscussion(discussionId, user.id),
    enabled: Number.isFinite(discussionId),
  });

  const discussion = discussionQuery.data ?? null;
  const belongsHere =
    discussion != null &&
    discussion.organizationId === organization.id &&
    discussion.deletedAt == null;

  const materialsQuery = useQuery({
    queryKey: discussionQueryKeys.materials(
      organization.id,
      belongsHere ? discussion.courseId : null,
    ),
    queryFn: () =>
      listAttachableMaterials({
        organizationId: organization.id,
        courseId: discussion?.courseId ?? null,
      }),
    enabled: belongsHere,
  });

  useEffect(() => {
    if (!Number.isFinite(discussionId)) return;
    return subscribeToDiscussionThread(discussionId, () => {
      void queryClient.invalidateQueries({
        queryKey: discussionQueryKeys.detail(discussionId, user.id),
      });
      void queryClient.invalidateQueries({
        queryKey: discussionQueryKeys.org(organization.id, user.id),
      });
    });
  }, [discussionId, organization.id, user.id, queryClient]);

  useEffect(() => {
    if (!belongsHere || !discussion) return;
    const cursor = `${discussion.id}:${discussion.lastMessageAt}`;
    if (markedReadFor.current === cursor) return;
    markedReadFor.current = cursor;
    void markDiscussionRead(discussion.id, user.id).then(() => {
      void queryClient.invalidateQueries({
        queryKey: discussionQueryKeys.org(organization.id, user.id),
      });
      void queryClient.invalidateQueries({
        queryKey: discussionQueryKeys.detail(discussion.id, user.id),
      });
    });
  }, [belongsHere, discussion, user.id, organization.id, queryClient]);

  function invalidate() {
    void queryClient.invalidateQueries({
      queryKey: discussionQueryKeys.detail(discussionId, user.id),
    });
    void queryClient.invalidateQueries({
      queryKey: discussionQueryKeys.org(organization.id, user.id),
    });
  }

  const attachmentContent: AttachmentContent[] = attachments.map((attachment) =>
    attachment.kind === "file"
      ? { kind: "file", label: attachment.label }
      : attachment.kind === "material"
        ? {
            kind: "material",
            materialId: attachment.materialId,
            label: attachment.label,
          }
        : {
            kind: "url",
            url: attachment.url,
            label: attachment.label,
          },
  );

  const post = useMutation({
    mutationFn: async () => {
      const message = validatePost(body, attachmentContent);
      if (message) {
        setFormError(message);
        throw new Error(message);
      }
      setFormError(null);
      const uploaded = await Promise.all(
        attachments.map(async (attachment) => {
          if (attachment.kind === "file") {
            const file = await uploadDiscussionFile({
              organizationId: organization.id,
              uploadedBy: user.id,
              file: attachment.file,
            });
            return {
              kind: "file" as const,
              fileId: file.id,
              label: attachment.label,
            };
          }
          if (attachment.kind === "material") {
            return {
              kind: "material" as const,
              materialId: attachment.materialId,
              label: attachment.label,
            };
          }
          return {
            kind: "url" as const,
            url: attachment.url,
            label: attachment.label,
          };
        }),
      );
      await createDiscussionMessage({
        discussionId,
        authorId: user.id,
        body,
        parentId: replyTo?.id ?? null,
        attachments: uploaded,
      });
    },
    onSuccess: () => {
      setBody("");
      setAttachments([]);
      setReplyTo(null);
      invalidate();
    },
  });

  const answered = useMutation({
    mutationFn: (next: boolean) =>
      setDiscussionAnswered({
        discussionId,
        answered: next,
        userId: user.id,
      }),
    onSuccess: invalidate,
  });

  const removeDiscussion = useMutation({
    mutationFn: () => softDeleteDiscussion(discussionId, user.id),
    onSuccess: invalidate,
  });

  const removeMessage = useMutation({
    mutationFn: (messageId: number) =>
      softDeleteDiscussionMessage(messageId, user.id),
    onSuccess: invalidate,
  });

  const nested = useMemo(
    () => nestDiscussionMessages(discussion?.messages ?? []),
    [discussion?.messages],
  );

  return {
    organization,
    discussion: belongsHere ? discussion : null,
    nested,
    canEdit,
    canMarkAnswered:
      belongsHere && discussion
        ? canMarkDiscussionAnswered({
            userId: user.id,
            createdBy: discussion.createdBy,
            isStaff,
          })
        : false,
    canRemoveThread: canRemoveDiscussion(canEdit),
    canRemoveMessage: (authorId: string) =>
      canRemoveMessage({
        userId: user.id,
        authorId,
        isStaffTeacherView: canEdit,
      }),
    body,
    setBody,
    attachments,
    setAttachments,
    replyTo,
    setReplyTo,
    materials: materialsQuery.data ?? [],
    canSubmit: validatePost(body, attachmentContent) == null,
    formError: formError ?? post.error?.message ?? null,
    posting: post.isPending,
    post: () => post.mutate(),
    answered,
    removeDiscussion,
    removeMessage,
    loading: discussionQuery.isLoading,
    error: discussionQuery.error ? discussionQuery.error.message : null,
    notFound:
      !discussionQuery.isLoading &&
      (!belongsHere || !discussion || discussion.deletedAt != null),
  };
}
