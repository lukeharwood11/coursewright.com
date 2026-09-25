import { Badge } from "@/ui/Badge";
import { ListCardLink } from "@/ui/ListCardLink";
import {
  announcementAudienceLabel,
  announcementTargetNames,
  announcementTargetSummary,
} from "@/announcements/model/audience";
import {
  announcementAvailabilityLabel,
  groupAnnouncementsByAvailability,
} from "@/announcements/model/availability";
import { announcementPath } from "@/announcements/model/paths";
import { announcementMetaParts } from "@/announcements/model/postedAt";
import { formatDateRange } from "@/courses/model/dates";
import type { AnnouncementRecord } from "@/announcements/databridge/announcements";

const GROUP_ORDER = ["available", "upcoming", "ended"] as const;

export function StaffAnnouncementList({
  orgSlug,
  items,
  today,
}: {
  orgSlug: string;
  items: AnnouncementRecord[];
  today: string;
}) {
  const groups = groupAnnouncementsByAvailability(items, today);

  return (
    <div className="mt-6 flex max-w-2xl flex-col gap-5">
      {GROUP_ORDER.map((key) =>
        groups[key].length === 0 ? null : (
          <section key={key}>
            <h2 className="text-[13px] font-bold text-[var(--ink-faint)]">
              {announcementAvailabilityLabel(key)}
            </h2>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {groups[key].map((item) => {
                const dates = formatDateRange(item.startDate, item.endDate);
                const meta = announcementMetaParts({
                  authorName: item.authorName,
                  createdAt: item.createdAt,
                  dateRange: dates,
                }).join(" · ");
                return (
                  <li key={item.id}>
                    <ListCardLink to={announcementPath(orgSlug, item.id)}>
                      <span className="text-[15px] font-extrabold text-[var(--ink)]">
                        {item.title}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant="slate">
                          {announcementAudienceLabel(item.audience)}
                        </Badge>
                        <span className="text-[13px] font-bold text-[var(--green-deep)]">
                          {announcementTargetSummary(
                            announcementTargetNames(item),
                            announcementAudienceLabel(item.audience),
                          )}
                        </span>
                      </span>
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
        ),
      )}
    </div>
  );
}
