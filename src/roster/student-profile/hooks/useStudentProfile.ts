import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import { getOrganization } from "@/organizations/databridge/organizations";
import {
  classQueryKeys,
  listClassesForStudent,
} from "@/roster/databridge/classes";
import {
  enrollmentQueryKeys,
  listStudentEnrollments,
} from "@/roster/databridge/enrollments";
import {
  getStudent,
  studentQueryKeys,
  updateStudent,
} from "@/roster/databridge/students";
import { validateStudentProfile } from "@/roster/model/studentProfile";

export function useStudentProfile() {
  const { studentId: studentIdParam } = useParams();
  const studentId = studentIdParam ? Number(studentIdParam) : NaN;
  const { organization } = useOrgShell();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: studentQueryKeys.detail(studentId),
    queryFn: () => getStudent(studentId),
    enabled: Number.isFinite(studentId),
  });

  const student = query.data ?? null;
  const belongsHere = student?.organizationId === organization.id;

  const organizationQuery = useQuery({
    queryKey: orgQueryKeys.detail(organization.id),
    queryFn: () => getOrganization(organization.id),
  });

  const enrollmentsQuery = useQuery({
    queryKey: enrollmentQueryKeys.byStudent(studentId),
    queryFn: () => listStudentEnrollments(studentId),
    enabled: Number.isFinite(studentId) && belongsHere,
  });

  const classesQuery = useQuery({
    queryKey: classQueryKeys.forStudent(studentId),
    queryFn: () => listClassesForStudent(studentId),
    enabled: Number.isFinite(studentId) && belongsHere,
  });

  const [name, setName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!student || !belongsHere) return;
    setName(student.name);
    setParentEmail(student.parentEmail ?? "");
    setGradeLevel(student.gradeLevel ?? "");
    setFormError(null);
  }, [student, belongsHere]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!student) throw new Error("Student isn’t loaded yet.");
      const parsed = validateStudentProfile({
        name,
        parentEmail,
        gradeLevel,
        gradeLabels: organizationQuery.data?.gradeLabels ?? [],
      });
      if (!parsed.ok) throw new Error(parsed.error);
      return updateStudent(student.id, parsed.value);
    },
    onSuccess: async (saved) => {
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: studentQueryKeys.detail(saved.id),
      });
      await queryClient.invalidateQueries({
        queryKey: studentQueryKeys.list(organization.id),
      });
      toast("Student saved.");
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    saveMutation.mutate();
  }

  return {
    organization,
    student: belongsHere ? student : null,
    gradeLabels: organizationQuery.data?.gradeLabels ?? [],
    enrollments: enrollmentsQuery.data ?? [],
    classes: classesQuery.data ?? [],
    loading: query.isLoading,
    error: query.error ? query.error.message : null,
    notFound: !query.isLoading && (!student || !belongsHere),
    name,
    parentEmail,
    gradeLevel,
    formError,
    saving: saveMutation.isPending,
    setName: (value: string) => {
      setName(value);
      setFormError(null);
    },
    setParentEmail: (value: string) => {
      setParentEmail(value);
      setFormError(null);
    },
    setGradeLevel: (value: string) => {
      setGradeLevel(value);
      setFormError(null);
    },
    onSubmit,
  };
}
