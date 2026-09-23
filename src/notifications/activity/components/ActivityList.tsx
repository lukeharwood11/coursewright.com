import {
  AcademicCapIcon,
  AtSymbolIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/solid";
import { formatDiscussionActivityAt } from "@/discussions/model/time";
import {
  activityHeadline,
  activityMetaParts,
  activityPreview,
  type ActivityItem,
  type ActivityKind,
} from "@/notifications/model/activity";

function ActivityTypeIcon({
  kind,
  unread,
}: {
  kind: ActivityKind;
  unread: boolean;
}) {
  const className = `mt-0.5 h-5 w-5 shrink-0 ${
    unread ? "text-[var(--green)]" : "text-[var(--ink-faint)]"
  }`;
  if (kind === "discussion_mention") {
    return <AtSymbolIcon className={className} aria-hidden />;
  }
  if (kind === "announcement") {
    return <MegaphoneIcon className={className} aria-hidden />;
  }
  if (kind === "report_card") {
    return <AcademicCapIcon className={className} aria-hidden />;
  }
  return <ChatBubbleLeftRightIcon className={className} aria-hidden />;
}

export function ActivityList({
  items,
  openingId,
  onOpen,
}: {
  items: ActivityItem[];
  openingId: number | null;
  onOpen: (item: ActivityItem) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="mt-6 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        Nothing here yet.
      </p>
    );
  }

  return (
    <ul className="mt-6 flex max-w-2xl flex-col gap-1.5">
      {items.map((item) => {
        const unread = item.readAt == null;
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
              onClick={() => onOpen(item)}
              disabled={openingId === item.id}
              className={`flex w-full items-start gap-2.5 rounded-[10px] border px-3.5 py-3 text-left ${
                unread
                  ? "border-[var(--green)] bg-[var(--green-tint)]"
                  : "border-[var(--line)] bg-[var(--surface)]"
              } hover:border-[var(--green)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]`}
            >
              <ActivityTypeIcon kind={item.kind} unread={unread} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-extrabold text-[var(--ink)]">
                    {headline}
                  </span>
                  {unread ? (
                    <span className="sr-only">New</span>
                  ) : (
                    <span className="sr-only">Seen</span>
                  )}
                </span>
                <span className="mt-1 block line-clamp-2 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                  {activityPreview(item.preview)}
                </span>
                <span className="mt-1.5 block text-[13px] font-bold text-[var(--ink)]">
                  {meta}
                  {time ? ` · ${time}` : ""}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
