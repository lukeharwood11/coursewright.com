import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import { getOrganization } from "@/organizations/databridge/organizations";
import { classQueryKeys, createClass, listClasses } from "@/roster/databridge/classes";
import { createStudent, listStudents, studentQueryKeys } from "@/roster/databridge/students";
import { validateClass } from "@/roster/model/classGroup";
import {
  studentMatchesQuery,
  validateStudentProfile,
} from "@/roster/model/studentProfile";

export function useOrgRoster() {
  const { organization } = useOrgShell();
  const queryClient = useQueryClient();

  const studentsQuery = useQuery({
    queryKey: studentQueryKeys.list(organization.id),
    queryFn: () => listStudents(organization.id),
  });

  const classesQuery = useQuery({
    queryKey: classQueryKeys.list(organization.id),
    queryFn: () => listClasses(organization.id),
  });

  const organizationQuery = useQuery({
    queryKey: orgQueryKeys.detail(organization.id),
    queryFn: () => getOrganization(organization.id),
  });

  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [studentError, setStudentError] = useState<string | null>(null);
  const [classTitle, setClassTitle] = useState("");
  const [classError, setClassError] = useState<string | null>(null);

  const addStudentMutation = useMutation({
    mutationFn: async () => {
      const parsed = validateStudentProfile({
        name,
        parentEmail,
        gradeLevel,
        gradeLabels: organizationQuery.data?.gradeLabels ?? [],
      });
      if (!parsed.ok) throw new Error(parsed.error);
      return createStudent(organization.id, parsed.value);
    },
    onSuccess: async () => {
      setName("");
      setParentEmail("");
      setGradeLevel("");
      setStudentError(null);
      await queryClient.invalidateQueries({
        queryKey: studentQueryKeys.list(organization.id),
      });
      toast("Student added.");
    },
    onError: (error: Error) => {
      setStudentError(error.message);
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async () => {
      const parsed = validateClass({ title: classTitle });
      if (!parsed.ok) throw new Error(parsed.error);
      return createClass(organization.id, parsed.value);
    },
    onSuccess: async () => {
      setClassTitle("");
      setClassError(null);
      await queryClient.invalidateQueries({
        queryKey: classQueryKeys.list(organization.id),
      });
      toast("Class created.");
    },
    onError: (error: Error) => {
      setClassError(error.message);
    },
  });

  const students = (studentsQuery.data ?? []).filter((student) =>
    studentMatchesQuery(student, query),
  );

  function onAddStudent(event: FormEvent) {
    event.preventDefault();
    setStudentError(null);
    addStudentMutation.mutate();
  }

  function onCreateClass(event: FormEvent) {
    event.preventDefault();
    setClassError(null);
    createClassMutation.mutate();
  }

  return {
    organization,
    gradeLabels: organizationQuery.data?.gradeLabels ?? [],
    students,
    classes: classesQuery.data ?? [],
    query,
    name,
    parentEmail,
    gradeLevel,
    studentError,
    classTitle,
    classError,
    loading: studentsQuery.isLoading || classesQuery.isLoading,
    error: studentsQuery.error
      ? studentsQuery.error.message
      : classesQuery.error
        ? classesQuery.error.message
        : null,
    addingStudent: addStudentMutation.isPending,
    creatingClass: createClassMutation.isPending,
    setQuery,
    setName: (value: string) => {
      setName(value);
      setStudentError(null);
    },
    setParentEmail: (value: string) => {
      setParentEmail(value);
      setStudentError(null);
    },
    setGradeLevel: (value: string) => {
      setGradeLevel(value);
      setStudentError(null);
    },
    setClassTitle: (value: string) => {
      setClassTitle(value);
      setClassError(null);
    },
    onAddStudent,
    onCreateClass,
  };
}
