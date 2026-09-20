import { Link } from "react-router-dom";
import {
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { ButtonLink } from "@/ui/Button";
import { PublishedBadge } from "@/ui/PublishedBadge";
import { newAnnouncementPath } from "@/announcements/model/paths";
import { newDiscussionPath } from "@/discussions/model/paths";
import { formatDateRange } from "@/courses/model/dates";
import { formatGradeLevels } from "@/courses/model/gradeLevels";
import { courseRosterPath, courseSettingsPath, coursesPath } from "@/courses/model/paths";
import { courseStatusLabel, type CourseStatus } from "@/courses/model/status";
import { isCoursePublished, type CourseVisibility } from "@/courses/model/visibility";
import { CourseActionsMenu } from "./CourseActionsMenu";

export function CourseHeader({
  orgSlug,
  courseId,
  title,
  description,
  location,
  subject,
  status,
  visibility,
  startDate,
  endDate,
  gradeLevels,
  gradeLabels,
  copiedFromTitle,
  canEdit,
  isParent,
  onShare,
}: {
  orgSlug: string;
  courseId: number;
  title: string;
  description: string;
  location: string;
  subject: string;
  status: CourseStatus;
  visibility: CourseVisibility;
  startDate: string | null;
  endDate: string | null;
  gradeLevels: string[];
  gradeLabels: string[];
  copiedFromTitle: string | null;
  canEdit: boolean;
  isParent: boolean;
  onShare: () => void;
}) {
  const dates = formatDateRange(startDate, endDate);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1
          className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant={status === "active" ? "green" : "neutral"}>
            {courseStatusLabel(status)}
          </Badge>
          {isCoursePublished(visibility) ? (
            canEdit ? <PublishedBadge /> : null
          ) : (
            <Badge variant="amber">Unpublished</Badge>
          )}
          {dates ? <Badge variant="neutral">{dates}</Badge> : null}
          {subject ? <Badge variant="slate">{subject}</Badge> : null}
          {gradeLevels.length > 0 ? (
            <Badge variant="neutral">
              {formatGradeLevels(gradeLevels, gradeLabels)}
            </Badge>
          ) : null}
        </div>
        {description ? (
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
            {description}
          </p>
        ) : null}
        {location ? (
          <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
            {location}
          </p>
        ) : null}
        {copiedFromTitle ? (
          <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
            Created from {copiedFromTitle}. This copy doesn’t stay in sync.
          </p>
        ) : null}
        <p className="mt-3 text-[13px]">
          <Link
            to={isParent ? `/my/${orgSlug}` : coursesPath(orgSlug)}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            {isParent ? "Back to this week" : "Back to courses"}
          </Link>
          {canEdit ? (
            <>
              <span className="text-[var(--ink-faint)]"> · </span>
              <Link
                to={courseSettingsPath(orgSlug, courseId)}
                className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
              >
                Settings
              </Link>
              <span className="text-[var(--ink-faint)]"> · </span>
              <Link
                to={courseRosterPath(orgSlug, courseId)}
                className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
              >
                Roster
              </Link>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {canEdit || isParent ? (
          <ButtonLink
            variant="secondary"
            className="hidden md:inline-flex"
            to={newDiscussionPath(orgSlug, {
              audience: "course",
              courseId,
            })}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden />
            Start a discussion
          </ButtonLink>
        ) : null}
        {canEdit ? (
          <ButtonLink
            variant="secondary"
            className="hidden md:inline-flex"
            to={newAnnouncementPath(orgSlug, {
              audience: "course",
              courseId,
            })}
          >
            <MegaphoneIcon className="h-5 w-5" aria-hidden />
            Create Announcement
          </ButtonLink>
        ) : null}
        {canEdit ? (
          <ButtonLink
            variant="secondary"
            className="hidden md:inline-flex"
            to={courseSettingsPath(orgSlug, courseId)}
          >
            <Cog6ToothIcon className="h-5 w-5" aria-hidden />
            Settings
          </ButtonLink>
        ) : null}
        <CourseActionsMenu
          orgSlug={orgSlug}
          courseId={courseId}
          canEdit={canEdit}
          isParent={isParent}
          onShare={onShare}
        />
      </div>
    </div>
  );
}
