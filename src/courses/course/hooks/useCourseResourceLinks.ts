import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  courseResourceLinkQueryKeys,
  createCourseResourceLink,
  deleteCourseResourceLink,
  listCourseResourceLinks,
} from "@/courses/databridge/courseResourceLinks";

export function useCourseResourceLinks(courseId: number, enabled: boolean) {
  const queryClient = useQueryClient();
  const queryKey = courseResourceLinkQueryKeys.list(courseId);

  const linksQuery = useQuery({
    queryKey,
    queryFn: () => listCourseResourceLinks(courseId),
    enabled: enabled && Number.isFinite(courseId),
  });

  const addLink = useMutation({
    mutationFn: (target: { folderId: number } | { itemId: number }) =>
      createCourseResourceLink({
        courseId,
        folderId: "folderId" in target ? target.folderId : undefined,
        itemId: "itemId" in target ? target.itemId : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeLink = useMutation({
    mutationFn: (linkId: number) => deleteCourseResourceLink(linkId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return { linksQuery, addLink, removeLink };
}
