import { Link } from "react-router-dom";
import {
  BellAlertIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import {
  announcementAudienceLabel,
  announcementTargetName,
} from "@/announcements/model/audience";
import { announcementPath } from "@/announcements/model/paths";
import { announcementMetaParts } from "@/announcements/model/postedAt";
import { formatDateRange } from "@/courses/model/dates";
import {
  bulletinForStudentsLabel,
  type ParentAnnouncementItem,
} from "@/parent/model/dashboard";

export function ParentAnnouncementsList({
  orgSlug,
  items,
  showStudent,
}: {
  orgSlug: string;
  items: ParentAnnouncementItem[];
  showStudent: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="mt-6 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        There are no announcements at this time.
      </p>
    );
  }

  return (
    <ul className="mt-6 flex max-w-2xl flex-col gap-1.5">
      {items.map((item) => {
        const dates = formatDateRange(item.startDate, item.endDate);
        const forLabel = showStudent
          ? bulletinForStudentsLabel(item.students)
          : null;
        const meta = announcementMetaParts({
          audienceLabel: announcementAudienceLabel(item.audience),
          authorName: item.authorName,
          createdAt: item.createdAt,
          dateRange: dates,
        }).join(" · ");
        return (
          <li key={item.id}>
            <Link
              to={announcementPath(orgSlug, item.id)}
              className={`flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 ${
                item.read
                  ? "border-[var(--line)] bg-[var(--surface)]"
                  : "border-[var(--green)] bg-[var(--green-tint)]"
              }`}
            >
              {item.read ? (
                <CheckCircleIcon
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--green)]"
                  aria-hidden
                />
              ) : (
                <BellAlertIcon
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--green)]"
                  aria-hidden
                />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-extrabold text-[var(--ink)]">
                    {item.title}
                  </span>
                  {item.read ? (
                    <span className="sr-only">Seen</span>
                  ) : (
                    <span className="sr-only">New</span>
                  )}
                </span>
                {item.body ? (
                  <span className="mt-1 block line-clamp-2 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                    {item.body}
                  </span>
                ) : null}
                <span className="mt-1.5 block text-[14px] font-extrabold text-[var(--green-deep)]">
                  {announcementTargetName(item)}
                </span>
                {forLabel ? (
                  <span className="mt-0.5 block text-[13px] font-bold text-[var(--ink)]">
                    {forLabel}
                  </span>
                ) : null}
                <span className="mt-0.5 block text-[12.5px] text-[var(--ink-faint)]">
                  {meta}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
