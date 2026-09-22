import {
  AtSymbolIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/solid";
import { formatDiscussionActivityAt } from "@/discussions/model/time";
import {
  activityHeadline,
  activityMetaParts,
  activityPreview,
  remainingUnreadLabel,
  type ActivityItem,
  type ActivityKind,
} from "@/notifications/model/activity";
import { ButtonLink } from "@/ui/Button";
import { useToastOnError } from "@/ui/useToastOnError";

function ActivityTypeIcon({ kind }: { kind: ActivityKind }) {
  const className = "mt-0.5 h-4 w-4 shrink-0 text-[var(--green)]";
  if (kind === "discussion_mention") {
    return <AtSymbolIcon className={className} aria-hidden />;
  }
  if (kind === "announcement") {
    return <MegaphoneIcon className={className} aria-hidden />;
  }
  return <ChatBubbleLeftRightIcon className={className} aria-hidden />;
}

export function ActivityMenuPanel({
  preview,
  remainingUnread,
  loading,
  error,
  openingId,
  activityHref,
  onOpen,
  onViewAll,
}: {
  preview: ActivityItem[];
  remainingUnread: number;
  loading: boolean;
  error: string | null;
  openingId: number | null;
  activityHref: string;
  onOpen: (item: ActivityItem) => void;
  onViewAll: () => void;
}) {
  const remaining = remainingUnreadLabel(remainingUnread);
  useToastOnError(error);

  return (
    <div className="flex flex-col">
      <div className="px-3.5 pb-2 pt-3">
        <p className="text-[11px] font-bold text-[var(--ink-faint)]">Activity</p>
      </div>
      {loading ? (
        <p className="px-3.5 pb-3 text-[13px] text-[var(--ink-soft)]">
          Loading activity…
        </p>
      ) : preview.length === 0 ? (
        <p className="px-3.5 pb-3 text-[14px] leading-relaxed text-[var(--ink-soft)]">
          You&apos;re all caught up!
        </p>
      ) : (
        <ul className="flex flex-col gap-1 px-2 pb-2">
          {preview.map((item) => {
            const headline = activityHeadline({
              kind: item.kind,
              title: item.title,
              audienceLabel: item.audienceLabel,
            });
            const meta = activityMetaParts({ actorName: item.actorName });
            const time = formatDiscussionActivityAt(item.createdAt);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onOpen(item)}
                  disabled={openingId === item.id}
                  className="flex w-full items-start gap-2 rounded-[8px] border border-[var(--green)] bg-[var(--green-tint)] px-2.5 py-2 text-left hover:border-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                >
                  <ActivityTypeIcon kind={item.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="block line-clamp-2 text-[13px] font-extrabold text-[var(--ink)]">
                      {headline}
                    </span>
                    <span className="mt-0.5 block line-clamp-1 text-[12px] leading-snug text-[var(--ink-soft)]">
                      {activityPreview(item.preview)}
                    </span>
                    <span className="mt-1 block text-[11.5px] font-bold text-[var(--ink)]">
                      {meta}
                      {time ? ` · ${time}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {remaining ? (
        <p className="px-3.5 pb-2 text-[12px] font-bold text-[var(--ink-soft)]">
          {remaining}
        </p>
      ) : null}
      <div className="border-t border-[var(--line-soft)] p-2.5" onClick={onViewAll}>
        <ButtonLink to={activityHref} variant="secondary" fullWidth>
          View all activity
        </ButtonLink>
      </div>
    </div>
  );
}
