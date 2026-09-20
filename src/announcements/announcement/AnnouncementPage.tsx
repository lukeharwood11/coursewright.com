import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { PageLoading } from "@/ui/PageLoading";
import { Button, ButtonLink } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { useToastOnError } from "@/ui/useToastOnError";
import { formatDateRange } from "@/courses/model/dates";
import {
  announcementAudienceLabel,
  announcementTargetNames,
} from "@/announcements/model/audience";
import { AnnouncementAudienceTargets } from "./components/AnnouncementAudienceTargets";
import {
  announcementAvailability,
  announcementAvailabilityLabel,
} from "@/announcements/model/availability";
import {
  announcementEditPath,
  announcementsPath,
} from "@/announcements/model/paths";
import { announcementPostedLabel, announcementAuthorLabel } from "@/announcements/model/postedAt";
import { useAnnouncement } from "./hooks/useAnnouncement";

export function AnnouncementPage() {
  const page = useAnnouncement();
  useToastOnError(page.error);
  const navigate = useNavigate();
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    document.title = page.announcement
      ? `${page.announcement.title} · Course Wright`
      : "Announcement · Course Wright";
  }, [page.announcement]);

  if (page.loading) {
    return (
      <PageLoading label="Loading note…" />
    );
  }

  if (page.unavailable) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          This note isn’t available right now
        </h1>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          Your teacher set when this shows up. Check back during that window, or
          go back to announcements.
        </p>
        <p className="mt-4 text-[13px]">
          <Link
            to={announcementsPath(page.organization.slug)}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to announcements
          </Link>
        </p>
      </div>
    );
  }

  if (page.notFound || !page.announcement) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that note
        </h1>
        <p className="mt-4 text-[13px]">
          <Link
            to={announcementsPath(page.organization.slug)}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back
          </Link>
        </p>
      </div>
    );
  }

  const dates = formatDateRange(
    page.announcement.startDate,
    page.announcement.endDate,
  );
  const posted = announcementPostedLabel(page.announcement.createdAt);
  const author = announcementAuthorLabel(page.announcement.authorName);
  const status = announcementAvailability(
    page.today,
    page.announcement.startDate,
    page.announcement.endDate,
  );

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {page.announcement.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {page.canEdit ? (
              <Badge variant={status === "available" ? "green" : "neutral"}>
                {announcementAvailabilityLabel(status)}
              </Badge>
            ) : null}
            <Badge variant="slate">
              {announcementAudienceLabel(page.announcement.audience)}
            </Badge>
            <AnnouncementAudienceTargets
              names={announcementTargetNames(page.announcement)}
            />
            {author ? <Badge variant="neutral">{author}</Badge> : null}
            {posted ? <Badge variant="neutral">{posted}</Badge> : null}
            {dates ? <Badge variant="neutral">{dates}</Badge> : null}
          </div>
          <p className="mt-3 text-[13px]">
            <Link
              to={announcementsPath(page.organization.slug)}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Back to announcements
            </Link>
          </p>
        </div>
        {page.canEdit ? (
          <div className="flex flex-wrap gap-2">
            <ButtonLink
              variant="secondary"
              to={announcementEditPath(
                page.organization.slug,
                page.announcement.id,
              )}
            >
              Edit
            </ButtonLink>
            <Button
              variant="secondary"
              onClick={() => setConfirmRemove(true)}
              disabled={page.remove.isPending}
            >
              Remove
            </Button>
          </div>
        ) : null}
      </div>

      {page.announcement.body ? (
        <p className="mt-6 max-w-2xl whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ink)]">
          {page.announcement.body}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmRemove}
        title="Remove this announcement?"
        body="Families won’t see it on their home anymore. You can make a new one later if you need it again."
        confirmLabel={page.remove.isPending ? "Removing…" : "Remove"}
        cancelLabel="Keep it"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          page.remove.mutate(undefined, {
            onSuccess: () => {
              navigate(announcementsPath(page.organization.slug));
            },
          });
        }}
      />
    </div>
  );
}
