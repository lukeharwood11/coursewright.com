import {
  BellAlertIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { Badge } from "@/ui/Badge";
import { ListCardLink } from "@/ui/ListCardLink";
import {
  announcementTargetName,
  announcementAudienceLabel,
} from "@/announcements/model/audience";
import { announcementPath } from "@/announcements/model/paths";
import { announcementMetaParts } from "@/announcements/model/postedAt";
import { formatDateRange } from "@/courses/model/dates";
import {
  bulletinForStudentsLabel,
  type ParentAnnouncementItem,
} from "@/parent/model/dashboard";

export function ParentAnnouncementList({
  orgSlug,
  items,
  showStudent,
}: {
  orgSlug: string;
  items: ParentAnnouncementItem[];
  showStudent: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-[13px] font-bold text-[var(--green-deep)]">
        Announcements
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((item) => {
          const dates = formatDateRange(item.startDate, item.endDate);
          const forLabel = showStudent
            ? bulletinForStudentsLabel(item.students)
            : null;
          const meta = announcementMetaParts({
            authorName: item.authorName,
            createdAt: item.createdAt,
            dateRange: dates,
          }).join(" · ");
          return (
            <li key={item.id}>
              <ListCardLink
                to={announcementPath(orgSlug, item.id)}
                highlighted={!item.read}
                leading={
                  item.read ? (
                    <CheckCircleIcon
                      className="mt-0.5 h-5 w-5 shrink-0 text-[var(--green)]"
                      aria-hidden
                    />
                  ) : (
                    <BellAlertIcon
                      className="mt-0.5 h-5 w-5 shrink-0 text-[var(--green)]"
                      aria-hidden
                    />
                  )
                }
              >
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
                <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="slate">
                    {announcementAudienceLabel(item.audience)}
                  </Badge>
                  <span className="text-[13px] font-bold text-[var(--green-deep)]">
                    {announcementTargetName(item)}
                  </span>
                </span>
                {forLabel ? (
                  <span className="mt-0.5 block text-[13px] font-bold text-[var(--ink)]">
                    {forLabel}
                  </span>
                ) : null}
                {meta ? (
                  <span className="mt-0.5 block text-[12.5px] text-[var(--ink-faint)]">
                    {meta}
                  </span>
                ) : null}
              </ListCardLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
