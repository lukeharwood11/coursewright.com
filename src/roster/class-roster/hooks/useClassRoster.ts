import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import { getOrganization } from "@/organizations/databridge/organizations";
import {
  addClassMember,
  classQueryKeys,
  getClass,
  listClassMembers,
  removeClassMember,
} from "@/roster/databridge/classes";
import { createStudent, listStudents, studentQueryKeys } from "@/roster/databridge/students";
import { studentsNotIn, validateStudentProfile } from "@/roster/model/studentProfile";

export function useClassRoster() {
  const { classId: classIdParam } = useParams();
  const classId = classIdParam ? Number(classIdParam) : NaN;
  const { organization } = useOrgShell();
  const queryClient = useQueryClient();
  const classReady = Number.isFinite(classId);

  const classQuery = useQuery({
    queryKey: classQueryKeys.detail(classId),
    queryFn: () => getClass(classId),
    enabled: classReady,
  });

  const classGroup = classQuery.data ?? null;
  const belongsHere = classGroup?.organizationId === organization.id;

  const membersQuery = useQuery({
    queryKey: classQueryKeys.members(classId),
    queryFn: () => listClassMembers(classId),
    enabled: classReady && belongsHere,
  });

  const studentsQuery = useQuery({
    queryKey: studentQueryKeys.list(organization.id),
    queryFn: () => listStudents(organization.id),
  });

  const organizationQuery = useQuery({
    queryKey: orgQueryKeys.detail(organization.id),
    queryFn: () => getOrganization(organization.id),
  });

  const members = membersQuery.data ?? [];
  const availableStudents = studentsNotIn(
    studentsQuery.data ?? [],
    members.map((member) => member.student.id),
  );

  const [selectedId, setSelectedId] = useState("");
  const [existingError, setExistingError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [newError, setNewError] = useState<string | null>(null);

  const addExistingMutation = useMutation({
    mutationFn: async () => {
      const studentId = Number(selectedId);
      if (!classReady || !Number.isFinite(studentId) || studentId <= 0) {
        throw new Error("Choose a student to add.");
      }
      await addClassMember(classId, studentId);
    },
    onSuccess: async () => {
      setSelectedId("");
      setExistingError(null);
      await invalidateClass(queryClient, organization.id, classId);
      toast("Student added to class.");
    },
    onError: (error: Error) => {
      setExistingError(error.message);
    },
  });

  const addNewMutation = useMutation({
    mutationFn: async () => {
      if (!classReady) throw new Error("Class isn’t loaded yet.");
      const parsed = validateStudentProfile({
        name,
        parentEmail,
        gradeLevel,
        gradeLabels: organizationQuery.data?.gradeLabels ?? [],
      });
      if (!parsed.ok) throw new Error(parsed.error);
      const student = await createStudent(organization.id, parsed.value);
      await addClassMember(classId, student.id);
      return student;
    },
    onSuccess: async () => {
      setName("");
      setParentEmail("");
      setGradeLevel("");
      setNewError(null);
      await invalidateClass(queryClient, organization.id, classId);
      toast("Student added to class.");
    },
    onError: (error: Error) => {
      setNewError(error.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: number) => removeClassMember(memberId),
    onSuccess: async () => {
      await invalidateClass(queryClient, organization.id, classId);
      toast("Student removed from class.");
    },
    onError: (error: Error) => {
      toast(error.message);
    },
  });

  function onAddExisting() {
    setExistingError(null);
    addExistingMutation.mutate();
  }

  function onAddNew(event: FormEvent) {
    event.preventDefault();
    setNewError(null);
    addNewMutation.mutate();
  }

  return {
    organization,
    classGroup: belongsHere ? classGroup : null,
    members,
    availableStudents,
    gradeLabels: organizationQuery.data?.gradeLabels ?? [],
    loading: classQuery.isLoading || membersQuery.isLoading,
    error: classQuery.error
      ? classQuery.error.message
      : membersQuery.error
        ? membersQuery.error.message
        : null,
    notFound: !classQuery.isLoading && (!classGroup || !belongsHere),
    selectedId,
    existingError,
    name,
    parentEmail,
    gradeLevel,
    newError,
    addingExisting: addExistingMutation.isPending,
    addingNew: addNewMutation.isPending,
    removingId: removeMutation.isPending ? (removeMutation.variables ?? null) : null,
    setSelectedId,
    setName: (value: string) => {
      setName(value);
      setNewError(null);
    },
    setParentEmail: (value: string) => {
      setParentEmail(value);
      setNewError(null);
    },
    setGradeLevel: (value: string) => {
      setGradeLevel(value);
      setNewError(null);
    },
    onAddExisting,
    onAddNew,
    onRemove: (memberId: number) => removeMutation.mutate(memberId),
  };
}

async function invalidateClass(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: number,
  classId: number,
) {
  await queryClient.invalidateQueries({
    queryKey: classQueryKeys.list(organizationId),
  });
  await queryClient.invalidateQueries({
    queryKey: studentQueryKeys.list(organizationId),
  });
  await queryClient.invalidateQueries({
    queryKey: classQueryKeys.members(classId),
  });
  await queryClient.invalidateQueries({
    queryKey: classQueryKeys.detail(classId),
  });
}
