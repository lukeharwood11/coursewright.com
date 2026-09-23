import { announcementPath } from "@/announcements/model/paths";
import { discussionMessagePath, discussionPath } from "@/discussions/model/paths";
import { progressPath, reportCardPath, studentPath } from "@/grading/model/paths";

export function activityPath(orgSlug: string): string {
  return `/my/${orgSlug}/activity`;
}

export function activityItemPath(
  orgSlug: string,
  item: {
    kind?: string | null;
    discussionId: number | null;
    discussionMessageId: number | null;
    announcementId: number | null;
    reportCardInstanceId?: number | null;
    studentProfileId?: number | null;
  },
  options?: { learner?: boolean },
): string | null {
  if (item.kind === "quiz_grade" || item.kind === "course_final") {
    if (options?.learner || item.studentProfileId == null) {
      return progressPath(orgSlug);
    }
    return studentPath(orgSlug, item.studentProfileId);
  }
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
