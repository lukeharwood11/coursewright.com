import { Link } from "react-router-dom";
import { TrashIcon } from "@heroicons/react/24/outline";
import type { SerializedEditorState } from "lexical";
import { formatDiscussionMessageTime } from "@/discussions/model/time";
import { parseDiscussionBody } from "@/discussions/model/messageBody";
import {
  discussionMessageElementId,
  discussionMessagePath,
} from "@/discussions/model/paths";
import { userProfilePath } from "@/organizations/model/paths";
import type { DiscussionMessageRecord } from "@/discussions/databridge/discussions";
import type { MentionPerson } from "@/discussions/model/mentions";
import { DiscussionAttachments } from "./DiscussionAttachments";
import { DiscussionLexicalEditor } from "./DiscussionLexicalEditor";
import { MessageActionsMenu } from "./MessageActionsMenu";
import {
  MessageComposer,
  type ComposerMode,
  type PendingAttachment,
} from "./MessageComposer";
import { MentionedPlainText } from "./MentionedPlainText";

export function DiscussionMessageItem({
  orgSlug,
  discussionId,
  message,
  isOwn,
  canEdit,
  canQuote,
  canRemove,
  isEditing,
  editMode,
  onEditMode,
  editBody,
  onEditBody,
  editLexical,
  onEditLexical,
  editComposeKey,
  editCanSave,
  editSaving,
  editError,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onQuote,
  onRemove,
  mentionPeople,
  mentionExcludeUserId,
  mentionsLoading,
}: {
  orgSlug: string;
  discussionId: number;
  message: DiscussionMessageRecord;
  isOwn: boolean;
  canEdit: boolean;
  canQuote: boolean;
  canRemove: boolean;
  isEditing: boolean;
  editMode: ComposerMode;
  onEditMode: (mode: ComposerMode) => void;
  editBody: string;
  onEditBody: (value: string) => void;
  editLexical: SerializedEditorState;
  onEditLexical: (value: SerializedEditorState) => void;
  editComposeKey: number;
  editCanSave: boolean;
  editSaving: boolean;
  editError: string | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onQuote: () => void;
  onRemove: () => void;
  mentionPeople: MentionPerson[];
  mentionExcludeUserId: string;
  mentionsLoading: boolean;
}) {
  const removed = message.deletedAt != null;
  const body = parseDiscussionBody(message.body);
  const elementId = discussionMessageElementId(message.id);
  const emptyAttachments: PendingAttachment[] = [];

  async function copyLink() {
    const path = discussionMessagePath(orgSlug, discussionId, message.id);
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;
    await navigator.clipboard.writeText(url);
  }

  return (
    <div
      id={elementId}
      className={
        isOwn
          ? "flex scroll-mt-4 justify-end"
          : "flex scroll-mt-4 justify-start"
      }
    >
      <article
        className={
          isOwn
            ? "w-full max-w-[85%] rounded-[10px] border border-[var(--line-soft)] bg-[var(--green-tint)] p-4 shadow-[var(--shadow)]"
            : "w-full max-w-[85%] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]"
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-[13.5px] font-extrabold text-[var(--ink)]">
            <Link
              to={userProfilePath(orgSlug, message.authorId)}
              className="hover:text-[var(--green-deep)]"
            >
              {message.authorName}
            </Link>
            <span className="ml-2 font-semibold text-[var(--ink-faint)]">
              {formatDiscussionMessageTime({
                createdAt: message.createdAt,
                updatedAt: message.updatedAt,
                deletedAt: message.deletedAt,
              })}
            </span>
          </p>
          <div className="flex items-center gap-0.5">
            {!removed && !isEditing ? (
              <MessageActionsMenu
                canEdit={canEdit}
                canQuote={canQuote}
                onEdit={onStartEdit}
                onQuote={onQuote}
                onCopyLink={() => {
                  void copyLink();
                }}
              />
            ) : null}
            {canRemove && !removed && !isEditing ? (
              <button
                type="button"
                className="rounded-[6px] p-1.5 text-[var(--ink-faint)] transition-colors hover:bg-[var(--amber-tint)] hover:text-[var(--amber-deep)]"
                aria-label="Remove message"
                title="Remove"
                onClick={onRemove}
              >
                <TrashIcon className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
        {removed ? (
          <p className="mt-2 text-[14px] italic text-[var(--ink-faint)]">
            This message was removed.
          </p>
        ) : isEditing ? (
          <div className="mt-2">
            <MessageComposer
              variant="plain"
              showAttachmentControls={false}
              mode={editMode}
              onMode={onEditMode}
              body={editBody}
              onBody={onEditBody}
              lexical={editLexical}
              onLexical={onEditLexical}
              composeKey={editComposeKey}
              attachments={emptyAttachments}
              onAttachments={() => undefined}
              materials={[]}
              canSubmit={editCanSave}
              submitting={editSaving}
              submitLabel="Save"
              busyLabel="Saving…"
              placeholder="Edit your message"
              error={editError}
              onSubmit={onSaveEdit}
              onCancel={onCancelEdit}
              mentionPeople={mentionPeople}
              mentionExcludeUserId={mentionExcludeUserId}
              mentionsLoading={mentionsLoading}
            />
            {message.attachments.length > 0 ? (
              <DiscussionAttachments
                orgSlug={orgSlug}
                attachments={message.attachments}
              />
            ) : null}
          </div>
        ) : (
          <>
            {body.format === "plain" && body.text.trim() ? (
              <MentionedPlainText text={body.text} people={mentionPeople} />
            ) : null}
            {body.format === "lexical" ? (
              <div className="mt-2">
                <DiscussionLexicalEditor
                  editorKey={`msg-${message.id}`}
                  initialLexical={body.lexical}
                  editable={false}
                  placeholder=""
                />
              </div>
            ) : null}
            <DiscussionAttachments
              orgSlug={orgSlug}
              attachments={message.attachments}
            />
          </>
        )}
      </article>
    </div>
  );
}
