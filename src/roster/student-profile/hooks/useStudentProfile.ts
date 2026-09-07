import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  getStudent,
  studentQueryKeys,
} from "@/roster/databridge/students";

export function useStudentProfile() {
  const { studentId: studentIdParam } = useParams();
  const studentId = studentIdParam ? Number(studentIdParam) : NaN;
  const { organization } = useOrgShell();

  const query = useQuery({
    queryKey: studentQueryKeys.detail(studentId),
    queryFn: () => getStudent(studentId),
    enabled: Number.isFinite(studentId),
  });

  const student = query.data ?? null;
  const belongsHere = student?.organizationId === organization.id;

  return {
    organization,
    student: belongsHere ? student : null,
    loading: query.isLoading,
    error: query.error ? query.error.message : null,
    notFound: !query.isLoading && (!student || !belongsHere),
  };
}
