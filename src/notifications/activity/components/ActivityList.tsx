import {
  BellAlertIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { formatDiscussionActivityAt } from "@/discussions/model/time";
import {
  activityMetaParts,
  activityPreview,
  type ActivityItem,
} from "@/notifications/model/activity";

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
        Nothing here yet. You’ll see discussion posts for classes you lead and
        courses you teach — and notices a teacher asked everyone to see.
      </p>
    );
  }

  return (
    <ul className="mt-6 flex max-w-2xl flex-col gap-1.5">
      {items.map((item) => {
        const unread = item.readAt == null;
        const meta = activityMetaParts({
          actorName: item.actorName,
          audienceLabel: item.audienceLabel,
        });
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
              {unread ? (
                <BellAlertIcon
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--green)]"
                  aria-hidden
                />
              ) : (
                <CheckCircleIcon
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--green)]"
                  aria-hidden
                />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-extrabold text-[var(--ink)]">
                    {item.title}
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
