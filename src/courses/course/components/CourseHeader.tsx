import { useState } from "react";
import {
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { ButtonLink } from "@/ui/Button";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PublishedBadge } from "@/ui/PublishedBadge";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { newAnnouncementPath } from "@/announcements/model/paths";
import { newDiscussionPath } from "@/discussions/model/paths";
import { formatDateRange } from "@/courses/model/dates";
import { formatGradeLevels } from "@/courses/model/gradeLevels";
import {
  courseSettingsPath,
  coursesPath,
} from "@/courses/model/paths";
import { courseStatusLabel, type CourseStatus } from "@/courses/model/status";
import {
  isCoursePublished,
  type CourseVisibility,
} from "@/courses/model/visibility";
import { CourseActionsMenu } from "./CourseActionsMenu";
import { CourseDetailsModal } from "./CourseDetailsModal";

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
  canEdit: boolean;
  isParent: boolean;
  onShare: () => void;
}) {
  const { organization } = useOrgShell();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const dates = formatDateRange(startDate, endDate);
  const backTo = coursesPath(orgSlug);
  const backLabel = "Back to courses";
  const showDiscussions = organization.features.discussions;
  const showAnnouncements = organization.features.announcements;

  const openDetails = () => setDetailsOpen(true);

  const courseActionsMenuProps = {
    orgSlug,
    courseId,
    canEdit,
    isParent,
    onShare,
    onShowDetails: openDetails,
  };

  return (
    <>
      <DetailPageHeader
        backTo={backTo}
        backLabel={backLabel}
        title={title}
        titleAccessory={
          <button
            type="button"
            className="inline-flex rounded-full text-[var(--ink-faint)] hover:text-[var(--ink-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            aria-label="Course details"
            onClick={openDetails}
          >
            <InformationCircleIcon className="h-5 w-5" aria-hidden />
          </button>
        }
        titleTrailing={
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            {showDiscussions && (canEdit || isParent) ? (
              <ButtonLink
                variant="secondary"
                className="max-xl:hidden shrink-0"
                to={newDiscussionPath(orgSlug, {
                  audience: "course",
                  courseId,
                })}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden />
                Start a discussion
              </ButtonLink>
            ) : null}
            {showAnnouncements && canEdit ? (
              <ButtonLink
                variant="secondary"
                className="max-xl:hidden shrink-0"
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
                className="max-xl:hidden shrink-0"
                to={courseSettingsPath(orgSlug, courseId)}
              >
                <Cog6ToothIcon className="h-5 w-5" aria-hidden />
                Settings
              </ButtonLink>
            ) : null}
            <CourseActionsMenu {...courseActionsMenuProps} />
          </div>
        }
        meta={
          <>
            <Badge variant={status === "active" ? "green" : "neutral"}>
              {courseStatusLabel(status)}
            </Badge>
            {isCoursePublished(visibility) ? (
              canEdit ? <PublishedBadge /> : null
            ) : (
              <Badge variant="amber">Unpublished</Badge>
            )}
            {dates ? <Badge variant="neutral">{dates}</Badge> : null}
            {gradeLevels.length > 0 ? (
              <Badge variant="neutral">
                {formatGradeLevels(gradeLevels, gradeLabels)}
              </Badge>
            ) : null}
          </>
        }
      />
      <CourseDetailsModal
        open={detailsOpen}
        courseTitle={title}
        description={description}
        subject={subject}
        location={location}
        onClose={() => setDetailsOpen(false)}
      />
    </>
  );
}
