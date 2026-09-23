import { announcementPath } from "@/announcements/model/paths";
import { discussionMessagePath, discussionPath } from "@/discussions/model/paths";
import { reportCardPath } from "@/grading/model/paths";

export function activityPath(orgSlug: string): string {
  return `/my/${orgSlug}/activity`;
}

export function activityItemPath(
  orgSlug: string,
  item: {
    discussionId: number | null;
    discussionMessageId: number | null;
    announcementId: number | null;
    reportCardInstanceId?: number | null;
  },
): string | null {
  if (item.reportCardInstanceId != null) {
    return reportCardPath(orgSlug, item.reportCardInstanceId);
  }
  if (item.announcementId != null) {
    return announcementPath(orgSlug, item.announcementId);
  }
  if (item.discussionId == null) return null;
  if (item.discussionMessageId != null) {
    return discussionMessagePath(orgSlug, item.discussionId, item.discussionMessageId);
  }
  return discussionPath(orgSlug, item.discussionId);
}
