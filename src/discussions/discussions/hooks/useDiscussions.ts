import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import {
  discussionQueryKeys,
  listDiscussionsForOrganization,
  listParentDiscussionContext,
} from "@/discussions/databridge/discussions";
import {
  parseDiscussionFilter,
  type DiscussionFilter,
} from "@/discussions/model/audience";
import {
  filterDiscussions,
  forStudentsLabel,
  isDiscussionUnread,
  sortDiscussionsForList,
  studentsForDiscussion,
  visibleDiscussions,
} from "@/discussions/model/unread";

export function useDiscussions() {
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const canEdit = staffCanEdit(role, parentPresentation);
  const [filter, setFilter] = useState<DiscussionFilter>("all");

  const listQuery = useQuery({
    queryKey: discussionQueryKeys.org(organization.id, user.id),
    queryFn: () => listDiscussionsForOrganization(organization.id, user.id),
  });

  const parentContextQuery = useQuery({
    queryKey: discussionQueryKeys.parentContext(organization.id, user.id),
    queryFn: () => listParentDiscussionContext(organization.id, user.id),
    enabled: parentPresentation,
  });

  const parentContext = parentContextQuery.data;
  const showStudent = (parentContext?.students.length ?? 0) > 1;
  const canCompose =
    canEdit ||
    (parentContext != null &&
      (parentContext.enrollments.length > 0 ||
        parentContext.classMembers.length > 0));

  const items = useMemo(() => {
    const visible = sortDiscussionsForList(
      filterDiscussions(visibleDiscussions(listQuery.data ?? []), filter),
    );
    return visible.map((item) => {
      const students =
        parentPresentation && parentContext
          ? studentsForDiscussion({
              audience: item.audience,
              courseId: item.courseId,
              classId: item.classId,
              students: parentContext.students,
              enrollments: parentContext.enrollments,
              classMembers: parentContext.classMembers,
            })
          : [];
      return {
        ...item,
        unread: isDiscussionUnread(item),
        forLabel: showStudent ? forStudentsLabel(students) : null,
      };
    });
  }, [listQuery.data, filter, parentPresentation, parentContext, showStudent]);

  return {
    organization,
    canCompose,
    isParent: parentPresentation,
    filter,
    setFilter: (value: string) => setFilter(parseDiscussionFilter(value)),
    items,
    loading: listQuery.isLoading || (parentPresentation && parentContextQuery.isLoading),
    error: listQuery.error
      ? listQuery.error.message
      : parentContextQuery.error
        ? parentContextQuery.error.message
        : null,
  };
}
