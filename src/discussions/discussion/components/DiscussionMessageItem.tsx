import { formatDiscussionActivityAt } from "@/discussions/model/time";
import type { DiscussionMessageRecord } from "@/discussions/databridge/discussions";
import { DiscussionAttachments } from "./DiscussionAttachments";

export function DiscussionMessageItem({
  orgSlug,
  message,
  canReply,
  canRemove,
  onReply,
  onRemove,
  isReply,
}: {
  orgSlug: string;
  message: DiscussionMessageRecord;
  canReply: boolean;
  canRemove: boolean;
  onReply: () => void;
  onRemove: () => void;
  isReply: boolean;
}) {
  const removed = message.deletedAt != null;

  return (
    <article className={isReply ? "mt-3 border-l-2 border-[var(--line-soft)] pl-4" : ""}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[13.5px] font-extrabold text-[var(--ink)]">
          {message.authorName}
          <span className="ml-2 font-semibold text-[var(--ink-faint)]">
            {formatDiscussionActivityAt(message.createdAt)}
          </span>
        </p>
        {canRemove && !removed ? (
          <button
            type="button"
            className="text-[12.5px] font-bold text-[var(--ink-soft)] hover:text-[var(--amber-deep)]"
            onClick={onRemove}
          >
            Remove
          </button>
        ) : null}
      </div>
      {removed ? (
        <p className="mt-1 text-[14px] italic text-[var(--ink-faint)]">
          This message was removed.
        </p>
      ) : (
        <>
          {message.body.trim() ? (
            <p className="mt-1 whitespace-pre-wrap text-[14.5px] leading-relaxed text-[var(--ink)]">
              {message.body}
            </p>
          ) : null}
          <DiscussionAttachments orgSlug={orgSlug} attachments={message.attachments} />
        </>
      )}
      {canReply && !removed ? (
        <p className="mt-2">
          <button
            type="button"
            className="text-[13px] font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            onClick={onReply}
          >
            Reply
          </button>
        </p>
      ) : null}
    </article>
  );
}
