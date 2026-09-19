import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { Button, ButtonLink } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { formatDateRange } from "@/courses/model/dates";
import { coursePath } from "@/courses/model/paths";
import {
  bulletinAvailability,
  bulletinAvailabilityLabel,
} from "@/bulletins/model/availability";
import { bulletinEditPath } from "@/bulletins/model/paths";
import { BulletinMaterialList } from "./components/BulletinMaterialList";
import { useBulletin } from "./hooks/useBulletin";

export function BulletinPage() {
  const page = useBulletin();
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    document.title = page.bulletin
      ? `${page.bulletin.title} · Course Wright`
      : "Bulletin · Course Wright";
  }, [page.bulletin]);

  if (page.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading note…</p>
      </div>
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
          Your teacher set dates for when this shows up. Check back during that
          window, or go back to this week.
        </p>
        <p className="mt-4 text-[13px]">
          <Link
            to={`/my/${page.organization.slug}`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to this week
          </Link>
        </p>
      </div>
    );
  }

  if (page.notFound || !page.bulletin || !page.course) {
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
            to={
              page.isParent
                ? `/my/${page.organization.slug}`
                : coursePath(page.organization.slug, page.courseId)
            }
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back
          </Link>
        </p>
      </div>
    );
  }

  const dates = formatDateRange(page.bulletin.startDate, page.bulletin.endDate);
  const status = bulletinAvailability(
    page.today,
    page.bulletin.startDate,
    page.bulletin.endDate,
  );

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {page.bulletin.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {page.canEdit ? (
              <Badge variant={status === "available" ? "green" : "neutral"}>
                {bulletinAvailabilityLabel(status)}
              </Badge>
            ) : null}
            {dates ? <Badge variant="neutral">{dates}</Badge> : null}
            <Badge variant="slate">{page.course.title}</Badge>
          </div>
          <p className="mt-3 text-[13px]">
            <Link
              to={
                page.isParent
                  ? `/my/${page.organization.slug}`
                  : coursePath(page.organization.slug, page.course.id)
              }
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              {page.isParent ? "Back to this week" : `Back to ${page.course.title}`}
            </Link>
          </p>
        </div>
        {page.canEdit ? (
          <div className="flex flex-wrap gap-2">
            <ButtonLink
              variant="secondary"
              to={bulletinEditPath(
                page.organization.slug,
                page.course.id,
                page.bulletin.id,
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

      {page.bulletin.body ? (
        <p className="mt-6 max-w-2xl whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ink)]">
          {page.bulletin.body}
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Materials</h2>
        <BulletinMaterialList
          orgSlug={page.organization.slug}
          courseId={page.course.id}
          materials={page.materials}
          showUnpublished={page.canEdit}
        />
      </section>

      {page.error ? (
        <p className="mt-4 text-[13px] text-[var(--amber-deep)]" role="alert">
          {page.error}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmRemove}
        title="Remove this note?"
        body="Families won’t see it on their home anymore. You can make a new one later if you need it again."
        confirmLabel={page.remove.isPending ? "Removing…" : "Remove"}
        cancelLabel="Keep it"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          page.remove.mutate();
        }}
      />
    </div>
  );
}
