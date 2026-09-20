import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  ArrowUturnLeftIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { PageLoading } from "@/ui/PageLoading";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import {
  discussionAudienceLabel,
  discussionStatusLabel,
  discussionTargetName,
} from "@/discussions/model/audience";
import { discussionsPath } from "@/discussions/model/paths";
import {
  discussionAuthorLabel,
  discussionStartedLabel,
} from "@/discussions/model/time";
import { isNearScrollBottom } from "@/discussions/model/thread";
import { DiscussionMembersModal } from "./components/DiscussionMembersModal";
import { DiscussionMessageItem } from "./components/DiscussionMessageItem";
import { DiscussionThreadMenu } from "./components/DiscussionThreadMenu";
import { MessageComposer } from "./components/MessageComposer";
import { useDiscussion } from "./hooks/useDiscussion";

export function DiscussionPage() {
  const page = useDiscussion();
  const navigate = useNavigate();
  const { hash: locationHash } = useLocation();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removeMessageId, setRemoveMessageId] = useState<number | null>(null);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const lastCount = useRef(0);

  useEffect(() => {
    document.title = page.discussion
      ? `${page.discussion.title} · Course Wright`
      : "Discussion · Course Wright";
  }, [page.discussion]);

  const messageCount = page.messages.length;
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (messageCount > lastCount.current && !stickToBottom.current) {
      setHasNewBelow(true);
    } else if (stickToBottom.current) {
      el.scrollTo({ top: el.scrollHeight });
      setHasNewBelow(false);
    }
    lastCount.current = messageCount;
  }, [messageCount]);

  useEffect(() => {
    if (page.loading || page.messages.length === 0) return;
    const hash = locationHash.replace(/^#/, "");
    if (!hash.startsWith("message-")) return;
    const target = document.getElementById(hash);
    if (!target) return;
    stickToBottom.current = false;
    target.scrollIntoView({ block: "center" });
  }, [page.loading, page.messages.length, page.discussion?.id, locationHash]);

  if (page.loading) {
    return (
      <PageLoading label="Loading discussion…" />
    );
  }

  if (page.notFound || !page.discussion) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          This discussion isn’t available
        </h1>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          It may have been removed, or you may not have access.
        </p>
        <p className="mt-4 text-[13px]">
          <Link
            to={discussionsPath(page.organization.slug)}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to discussions
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col px-3 py-8 md:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {page.discussion.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant={page.discussion.answeredAt ? "green" : "neutral"}>
              {discussionStatusLabel(page.discussion.answeredAt)}
            </Badge>
            <Badge variant="slate">
              {discussionAudienceLabel(page.discussion.audience)}
            </Badge>
            <span className="text-[13px] font-bold text-[var(--green-deep)]">
              {discussionTargetName(page.discussion)}
            </span>
          </div>
          <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
            {[
              discussionAuthorLabel(page.discussion.authorName),
              discussionStartedLabel(page.discussion.createdAt),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-3 text-[13px]">
            <Link
              to={discussionsPath(page.organization.slug)}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Back to discussions
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {page.canMarkAnswered ? (
            <Button
              variant="secondary"
              disabled={page.answered.isPending}
              onClick={() => page.answered.mutate(!page.discussion?.answeredAt)}
            >
              {page.discussion.answeredAt ? (
                <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden />
              ) : (
                <CheckCircleIcon className="h-4 w-4" aria-hidden />
              )}
              {page.discussion.answeredAt ? "Mark as open" : "Mark as answered"}
            </Button>
          ) : null}
          {page.canRemoveThread ? (
            <Button variant="secondary" onClick={() => setConfirmRemove(true)}>
              <TrashIcon className="h-4 w-4" aria-hidden />
              Delete
            </Button>
          ) : null}
          <DiscussionThreadMenu onMembers={() => page.setMembersOpen(true)} />
        </div>
      </div>

      {page.error ? (
        <p className="mt-4 text-[13px] text-[var(--amber-deep)]" role="alert">
          {page.error}
        </p>
      ) : null}

      <div
        ref={scrollerRef}
        className="relative mt-6 flex-1 overflow-y-auto"
        onScroll={(event) => {
          const el = event.currentTarget;
          stickToBottom.current = isNearScrollBottom(
            el.scrollTop,
            el.scrollHeight,
            el.clientHeight,
          );
          if (stickToBottom.current) setHasNewBelow(false);
        }}
      >
        <div className="flex flex-col gap-3 pb-4">
          {page.messages.map((message) => (
            <DiscussionMessageItem
              key={message.id}
              orgSlug={page.organization.slug}
              discussionId={page.discussion!.id}
              message={message}
              isOwn={message.authorId === page.userId}
              canEdit={page.canEditMessage(message)}
              canQuote={message.deletedAt == null}
              canRemove={page.canRemoveMessage(message.authorId)}
              isEditing={page.editingMessageId === message.id}
              editMode={page.editMode}
              onEditMode={page.setEditMode}
              editBody={page.editBody}
              onEditBody={page.setEditBody}
              editLexical={page.editLexical}
              onEditLexical={page.setEditLexical}
              editComposeKey={page.editComposeKey}
              editCanSave={page.editCanSave}
              editSaving={page.editSaving}
              editError={page.editError}
              onStartEdit={() => page.startEdit(message)}
              onCancelEdit={page.cancelEdit}
              onSaveEdit={page.saveEdit}
              onQuote={() => page.quoteMessage(message)}
              onRemove={() => setRemoveMessageId(message.id)}
              mentionPeople={page.members}
              mentionExcludeUserId={page.userId}
              mentionsLoading={page.membersLoading}
            />
          ))}
        </div>
        {hasNewBelow ? (
          <div className="sticky bottom-3 flex justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                const el = scrollerRef.current;
                if (!el) return;
                el.scrollTo({ top: el.scrollHeight });
                stickToBottom.current = true;
                setHasNewBelow(false);
              }}
            >
              New messages
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 w-full">
        <MessageComposer
          mode={page.mode}
          onMode={page.setMode}
          body={page.body}
          onBody={page.setBody}
          lexical={page.lexical}
          onLexical={page.setLexical}
          composeKey={page.composeKey}
          attachments={page.attachments}
          onAttachments={page.setAttachments}
          materials={page.materials}
          canSubmit={page.canSubmit}
          submitting={page.posting}
          submitLabel="Post"
          busyLabel="Posting…"
          placeholder="Write a message, or add a file, material, or link."
          error={page.formError}
          onSubmit={page.post}
          mentionPeople={page.members}
          mentionExcludeUserId={page.userId}
          mentionsLoading={page.membersLoading}
        />
      </div>

      <ConfirmDialog
        open={confirmRemove}
        title="Delete this discussion?"
        body="Families won’t see it anymore. You can start a new one later if you need it again."
        confirmLabel={page.removeDiscussion.isPending ? "Deleting…" : "Delete"}
        cancelLabel="Keep it"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          page.removeDiscussion.mutate(undefined, {
            onSuccess: () => {
              navigate(discussionsPath(page.organization.slug));
            },
          });
        }}
      />
      <ConfirmDialog
        open={removeMessageId != null}
        title="Remove this message?"
        body="People will see that the message was removed. Quotes of it stay on later posts."
        confirmLabel={page.removeMessage.isPending ? "Removing…" : "Remove"}
        cancelLabel="Keep it"
        onCancel={() => setRemoveMessageId(null)}
        onConfirm={() => {
          if (removeMessageId == null) return;
          const id = removeMessageId;
          setRemoveMessageId(null);
          page.removeMessage.mutate(id);
        }}
      />
      <DiscussionMembersModal
        open={page.membersOpen}
        members={page.members}
        loading={page.membersLoading}
        error={page.membersError}
        onClose={() => page.setMembersOpen(false)}
      />
    </div>
  );
}
