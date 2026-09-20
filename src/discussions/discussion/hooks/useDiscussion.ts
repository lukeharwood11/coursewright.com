import { useEffect, useRef, useState } from "react";
import type { SerializedEditorState } from "lexical";
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
  listDiscussionMembers,
  markDiscussionRead,
  setDiscussionAnswered,
  softDeleteDiscussion,
  softDeleteDiscussionMessage,
  updateDiscussionMessageBody,
  uploadDiscussionFile,
  type DiscussionMessageRecord,
} from "@/discussions/databridge/discussions";
import {
  markDiscussionNotificationsRead,
  notificationQueryKeys,
} from "@/notifications/databridge/notifications";
import { subscribeToDiscussionThread } from "@/discussions/databridge/realtime";
import {
  buildDiscussionQuote,
  emptyLexicalState,
  lexicalStateWithQuote,
  seedComposerFromMessageBody,
  serializeDiscussionBody,
} from "@/discussions/model/messageBody";
import {
  canEditMessage as mayEditMessage,
  canMarkDiscussionAnswered,
  canRemoveDiscussion,
  canRemoveMessage,
  validatePost,
  type AttachmentContent,
} from "@/discussions/model/validate";
import type {
  ComposerMode,
  PendingAttachment,
} from "../components/MessageComposer";

export function useDiscussion() {
  const params = useParams();
  const discussionId = params.discussionId ? Number(params.discussionId) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const canEdit = staffCanEdit(role, parentPresentation);
  const isStaff = role ? isStaffRole(role) : false;

  const [mode, setMode] = useState<ComposerMode>("plain");
  const [body, setBody] = useState("");
  const [lexical, setLexical] = useState<SerializedEditorState>(emptyLexicalState);
  const [composeKey, setComposeKey] = useState(0);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<ComposerMode>("plain");
  const [editBody, setEditBody] = useState("");
  const [editLexical, setEditLexical] =
    useState<SerializedEditorState>(emptyLexicalState);
  const [editComposeKey, setEditComposeKey] = useState(0);
  const [editError, setEditError] = useState<string | null>(null);
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

  const membersQuery = useQuery({
    queryKey: discussionQueryKeys.members(discussionId),
    queryFn: () => listDiscussionMembers(discussionId),
    enabled: belongsHere && membersOpen && Number.isFinite(discussionId),
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
    void Promise.all([
      markDiscussionRead(discussion.id, user.id),
      markDiscussionNotificationsRead(discussion.id),
    ]).then(() => {
      void queryClient.invalidateQueries({
        queryKey: discussionQueryKeys.org(organization.id, user.id),
      });
      void queryClient.invalidateQueries({
        queryKey: discussionQueryKeys.detail(discussion.id, user.id),
      });
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.org(organization.id, user.id),
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

  const draftBody =
    mode === "plain"
      ? ({ v: 1 as const, format: "plain" as const, text: body })
      : ({ v: 1 as const, format: "lexical" as const, lexical });

  const post = useMutation({
    mutationFn: async () => {
      const message = validatePost(draftBody, attachmentContent);
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
        body: serializeDiscussionBody(draftBody),
        attachments: uploaded,
      });
    },
    onSuccess: () => {
      setBody("");
      setLexical(emptyLexicalState());
      setMode("plain");
      setComposeKey((key) => key + 1);
      setAttachments([]);
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

  const editingMessage =
    editingMessageId == null
      ? null
      : (discussion?.messages.find((row) => row.id === editingMessageId) ?? null);

  const editAttachmentContent: AttachmentContent[] = (
    editingMessage?.attachments ?? []
  ).map((attachment) =>
    attachment.kind === "file"
      ? { kind: "file" as const, label: attachment.label }
      : attachment.kind === "material"
        ? {
            kind: "material" as const,
            materialId: attachment.materialId ?? 0,
            label: attachment.label,
          }
        : {
            kind: "url" as const,
            url: attachment.url ?? "",
            label: attachment.label,
          },
  );

  const editDraftBody =
    editMode === "plain"
      ? ({ v: 1 as const, format: "plain" as const, text: editBody })
      : ({ v: 1 as const, format: "lexical" as const, lexical: editLexical });

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (editingMessageId == null) {
        throw new Error("That message couldn’t be updated. Refresh and try again.");
      }
      const message = validatePost(editDraftBody, editAttachmentContent);
      if (message) {
        setEditError(message);
        throw new Error(message);
      }
      setEditError(null);
      await updateDiscussionMessageBody({
        messageId: editingMessageId,
        body: serializeDiscussionBody(editDraftBody),
      });
    },
    onSuccess: () => {
      setEditingMessageId(null);
      setEditError(null);
      invalidate();
    },
  });

  function startEdit(message: DiscussionMessageRecord) {
    if (
      !mayEditMessage({
        userId: user.id,
        authorId: message.authorId,
        deletedAt: message.deletedAt,
      })
    ) {
      return;
    }
    const seeded = seedComposerFromMessageBody(message.body);
    setEditingMessageId(message.id);
    setEditMode(seeded.mode);
    setEditBody(seeded.body);
    setEditLexical(seeded.lexical);
    setEditComposeKey((key) => key + 1);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingMessageId(null);
    setEditError(null);
  }

  function quoteMessage(message: DiscussionMessageRecord) {
    const cite = buildDiscussionQuote({
      authorName: message.authorName,
      body: message.body,
      hasAttachments: message.attachments.length > 0,
    });
    setLexical(
      lexicalStateWithQuote({
        quote: cite,
        followingText: mode === "plain" ? body : undefined,
        followingLexical: mode === "lexical" ? lexical : undefined,
      }),
    );
    setBody("");
    setMode("lexical");
    setComposeKey((key) => key + 1);
  }

  return {
    organization,
    userId: user.id,
    discussion: belongsHere ? discussion : null,
    messages: discussion?.messages ?? [],
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
    canEditMessage: (message: DiscussionMessageRecord) =>
      mayEditMessage({
        userId: user.id,
        authorId: message.authorId,
        deletedAt: message.deletedAt,
      }),
    mode,
    setMode,
    body,
    setBody,
    lexical,
    setLexical,
    composeKey,
    quoteMessage,
    editingMessageId,
    startEdit,
    cancelEdit,
    editMode,
    setEditMode,
    editBody,
    setEditBody,
    editLexical,
    setEditLexical,
    editComposeKey,
    editCanSave: validatePost(editDraftBody, editAttachmentContent) == null,
    editSaving: saveEdit.isPending,
    editError: editError ?? saveEdit.error?.message ?? null,
    saveEdit: () => saveEdit.mutate(),
    attachments,
    setAttachments,
    materials: materialsQuery.data ?? [],
    canSubmit: validatePost(draftBody, attachmentContent) == null,
    formError: formError ?? post.error?.message ?? null,
    posting: post.isPending,
    post: () => post.mutate(),
    answered,
    removeDiscussion,
    removeMessage,
    membersOpen,
    setMembersOpen,
    members: membersQuery.data ?? [],
    membersLoading: membersQuery.isLoading,
    membersError: membersQuery.error ? membersQuery.error.message : null,
    loading: discussionQuery.isLoading,
    error: discussionQuery.error ? discussionQuery.error.message : null,
    notFound:
      !discussionQuery.isLoading &&
      (!belongsHere || !discussion || discussion.deletedAt != null),
  };
}
