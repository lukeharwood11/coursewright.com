import { useQuery } from "@tanstack/react-query";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  listStudents,
  studentQueryKeys,
} from "@/roster/databridge/students";

export function useOrgRoster() {
  const { organization } = useOrgShell();
  const query = useQuery({
    queryKey: studentQueryKeys.list(organization.id),
    queryFn: () => listStudents(organization.id),
  });

  return {
    organization,
    students: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? query.error.message : null,
  };
}
