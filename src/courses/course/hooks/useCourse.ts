import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { courseQueryKeys, getCourse } from "@/courses/databridge/courses";

export function useCourse() {
  const { courseId } = useParams();
  const { organization } = useOrgShell();

  const query = useQuery({
    queryKey: courseQueryKeys.detail(courseId ?? ""),
    queryFn: () => getCourse(courseId ?? ""),
    enabled: Boolean(courseId),
  });

  const course = query.data ?? null;
  const belongsHere = course?.organizationId === organization.id;

  return {
    organization,
    course: belongsHere ? course : null,
    loading: query.isLoading,
    error: query.error ? query.error.message : null,
    notFound: !query.isLoading && (!course || !belongsHere),
  };
}
