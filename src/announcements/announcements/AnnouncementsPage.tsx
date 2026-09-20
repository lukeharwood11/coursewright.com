import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { ButtonLink } from "@/ui/Button";
import { useToastOnError } from "@/ui/useToastOnError";
import {
  announcementAudienceLabel,
  announcementTargetNames,
  announcementTargetSummary,
} from "@/announcements/model/audience";
import {
  announcementAvailability,
  announcementAvailabilityLabel,
  groupAnnouncementsByAvailability,
} from "@/announcements/model/availability";
import {
  announcementPath,
  newAnnouncementPath,
} from "@/announcements/model/paths";
import { announcementMetaParts } from "@/announcements/model/postedAt";
import { formatDateRange } from "@/courses/model/dates";
import { ParentAnnouncementsList } from "./components/ParentAnnouncementsList";
import { useAnnouncements } from "./hooks/useAnnouncements";

const GROUP_ORDER = ["available", "upcoming", "ended"] as const;

export function AnnouncementsPage() {
  const page = useAnnouncements();
  useToastOnError(page.error);

  useEffect(() => {
    document.title = "Announcements · Course Wright";
  }, []);

  if (page.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading announcements…</p>
      </div>
    );
  }

  if (page.isParent) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Announcements
        </h1>
        <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[var(--ink-soft)]">
          Notes from your teachers. Opening one marks it as seen.
        </p>
        <ParentAnnouncementsList
          orgSlug={page.organization.slug}
          items={page.parentAnnouncements}
          showStudent={page.showStudent}
        />
      </div>
    );
  }

  const groups = groupAnnouncementsByAvailability(page.announcements, page.today);

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Announcements
          </h1>
        </div>
        <ButtonLink to={newAnnouncementPath(page.organization.slug)}>
          New announcement
        </ButtonLink>
      </div>

      {page.announcements.length === 0 ? (
        <p className="mt-6 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          No announcements yet. Post one when families need a notice that isn’t
          this week’s materials.
        </p>
      ) : (
        <div className="mt-6 flex max-w-2xl flex-col gap-5">
          {GROUP_ORDER.map((key) =>
            groups[key].length === 0 ? null : (
              <section key={key}>
                <h2 className="text-[13px] font-bold text-[var(--ink-faint)]">
                  {announcementAvailabilityLabel(key)}
                </h2>
                <ul className="mt-1 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
                  {groups[key].map((item) => {
                    const dates = formatDateRange(item.startDate, item.endDate);
                    const meta = announcementMetaParts({
                      authorName: item.authorName,
                      createdAt: item.createdAt,
                      dateRange: dates,
                    }).join(" · ");
                    const status = announcementAvailability(
                      page.today,
                      item.startDate,
                      item.endDate,
                    );
                    return (
                      <li key={item.id}>
                        <Link
                          to={announcementPath(page.organization.slug, item.id)}
                          className="flex flex-col gap-1 px-4 py-3 hover:bg-[var(--green-tint)]"
                        >
                          <span className="text-[14.5px] font-semibold text-[var(--ink)]">
                            {item.title}
                          </span>
                          <span className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant={status === "available" ? "green" : "neutral"}
                            >
                              {announcementAudienceLabel(item.audience)}
                            </Badge>
                            <span className="text-[12.5px] text-[var(--ink-soft)]">
                              {announcementTargetSummary(
                                announcementTargetNames(item),
                                announcementAudienceLabel(item.audience),
                              )}
                            </span>
                            {meta ? (
                              <span className="text-[12.5px] text-[var(--ink-faint)]">
                                {meta}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}
