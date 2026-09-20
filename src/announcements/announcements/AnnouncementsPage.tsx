import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { ButtonLink } from "@/ui/Button";
import {
  announcementAudienceLabel,
  announcementTargetName,
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
import { formatDateRange } from "@/courses/model/dates";
import { useAnnouncements } from "./hooks/useAnnouncements";

const GROUP_ORDER = ["available", "upcoming", "ended"] as const;

export function AnnouncementsPage() {
  const page = useAnnouncements();

  useEffect(() => {
    document.title = "Announcements · Course Wright";
  }, []);

  if (!page.canEdit) {
    return <Navigate to={`/my/${page.organization.slug}`} replace />;
  }

  if (page.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading announcements…</p>
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
          <p className="mt-2 max-w-xl text-[14px] text-[var(--ink-soft)]">
            One-way notes to a course, a class, or a student. Families see them
            on home. There isn’t a reply thread.
          </p>
        </div>
        <ButtonLink to={newAnnouncementPath(page.organization.slug)}>
          New announcement
        </ButtonLink>
      </div>

      {page.error ? (
        <p className="mt-4 text-[13px] text-[var(--amber-deep)]" role="alert">
          {page.error}
        </p>
      ) : null}

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
                              {announcementTargetName(item)}
                            </span>
                            {dates ? (
                              <span className="text-[12.5px] text-[var(--ink-faint)]">
                                {dates}
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
