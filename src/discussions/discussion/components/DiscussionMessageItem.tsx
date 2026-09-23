import type { SerializedEditorState } from "lexical";
import { formatDiscussionMessageTime } from "@/discussions/model/time";
import { parseDiscussionBody } from "@/discussions/model/messageBody";
import {
  discussionMessageElementId,
  discussionMessagePath,
} from "@/discussions/model/paths";
import type { DiscussionMessageRecord } from "@/discussions/databridge/discussions";
import type { MentionPerson } from "@/discussions/model/mentions";
import { Avatar } from "@/ui/Avatar";
import { DiscussionAttachments } from "./DiscussionAttachments";
import { DiscussionLexicalEditor } from "./DiscussionLexicalEditor";
import {
  MessageActionsMenu,
  useMessageActionsMenu,
} from "./MessageActionsMenu";
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
  showGroupMeta,
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
  onOpenProfile,
  mentionPeople,
  mentionExcludeUserId,
  mentionsLoading,
}: {
  orgSlug: string;
  discussionId: number;
  message: DiscussionMessageRecord;
  isOwn: boolean;
  /** Name + time above the first bubble in a consecutive run from this author. */
  showGroupMeta: boolean;
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
  onOpenProfile: (userId: string) => void;
  mentionPeople: MentionPerson[];
  mentionExcludeUserId: string;
  mentionsLoading: boolean;
}) {
  const removed = message.deletedAt != null;
  const body = parseDiscussionBody(message.body);
  const elementId = discussionMessageElementId(message.id);
  const emptyAttachments: PendingAttachment[] = [];
  const timeLabel = showGroupMeta
    ? formatDiscussionMessageTime({
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        deletedAt: message.deletedAt,
      })
    : "";
  const showAuthor = showGroupMeta && !isOwn;
  const actions = useMessageActionsMenu();
  const showActions = !removed && !isEditing;

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
          ? "flex scroll-mt-4 flex-col items-end"
          : "flex scroll-mt-4 flex-col items-start"
      }
    >
      {showGroupMeta ? (
        <div
          className={
            isOwn
              ? "mb-0.5 flex w-fit max-w-[85%] flex-wrap items-center justify-end gap-x-1.5 px-1"
              : "mb-0.5 flex w-fit max-w-[85%] flex-wrap items-center gap-x-1.5 px-1"
          }
        >
          {showAuthor ? (
            <>
              <button
                type="button"
                className="shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                aria-label={`View ${message.authorName}'s profile`}
                onClick={() => onOpenProfile(message.authorId)}
              >
                <Avatar name={message.authorName} size={24} />
              </button>
              <button
                type="button"
                className="text-[12px] font-bold text-[var(--ink)] hover:text-[var(--green-deep)]"
                onClick={() => onOpenProfile(message.authorId)}
              >
                {message.authorName}
              </button>
            </>
          ) : null}
          {timeLabel ? (
            <span className="text-[11.5px] font-semibold text-[var(--ink-faint)]">
              {timeLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      <article
        className={[
          "relative max-w-[85%] rounded-[8px] border border-[var(--line-soft)] px-3 py-2",
          isEditing ? "w-full" : "w-fit",
          isOwn
            ? "bg-[var(--green-tint)]"
            : "bg-[var(--surface)]",
          showActions ? "[-webkit-touch-callout:none]" : "",
        ].join(" ")}
        onContextMenu={
          showActions ? actions.openFromContextMenu : undefined
        }
        {...(showActions ? actions.longPressHandlers : {})}
      >
        {showActions ? (
          <MessageActionsMenu
            canEdit={canEdit}
            canQuote={canQuote}
            canRemove={canRemove}
            onEdit={onStartEdit}
            onQuote={onQuote}
            onCopyLink={() => {
              void copyLink();
            }}
            onRemove={onRemove}
            open={actions.open}
            onClose={actions.close}
            anchorRect={actions.anchorRect}
          />
        ) : null}

        {removed ? (
          <p className="text-[13.5px] italic text-[var(--ink-faint)]">
            This message was removed.
          </p>
        ) : isEditing ? (
          <div>
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
          <div>
            {body.format === "plain" && body.text.trim() ? (
              <MentionedPlainText text={body.text} people={mentionPeople} />
            ) : null}
            {body.format === "lexical" ? (
              <DiscussionLexicalEditor
                editorKey={`msg-${message.id}`}
                initialLexical={body.lexical}
                editable={false}
                placeholder=""
              />
            ) : null}
            <DiscussionAttachments
              orgSlug={orgSlug}
              attachments={message.attachments}
            />
          </div>
        )}
      </article>
    </div>
  );
}
