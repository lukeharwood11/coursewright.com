import { useQuery } from "@tanstack/react-query";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { courseQueryKeys, listCourses } from "@/courses/databridge/courses";

export function useCourseList() {
  const { organization } = useOrgShell();
  const query = useQuery({
    queryKey: courseQueryKeys.list(organization.id),
    queryFn: () => listCourses(organization.id),
  });

  return {
    organization,
    courses: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? query.error.message : null,
  };
}
