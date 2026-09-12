import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  listOrgPeople,
  orgQueryKeys,
} from "@/organizations/databridge/memberships";
import { getOrganization } from "@/organizations/databridge/organizations";
import {
  addFamilyParent,
  addFamilyStudent,
  familyQueryKeys,
  getFamily,
  listFamilies,
  removeFamilyMember,
} from "@/roster/databridge/families";
import { createStudent, listStudents, studentQueryKeys } from "@/roster/databridge/students";
import {
  familyLabel,
  familyMemberNames,
  peopleNotInFamily,
  studentIdsInFamilies,
} from "@/roster/model/family";
import { studentsNotIn, validateStudentProfile } from "@/roster/model/studentProfile";

export function useFamily() {
  const { familyId: familyIdParam } = useParams();
  const familyId = familyIdParam ? Number(familyIdParam) : NaN;
  const { organization } = useOrgShell();
  const queryClient = useQueryClient();
  const familyReady = Number.isFinite(familyId);

  const familyQuery = useQuery({
    queryKey: familyQueryKeys.detail(familyId),
    queryFn: () => getFamily(familyId),
    enabled: familyReady,
  });

  const family = familyQuery.data ?? null;
  const belongsHere = family?.organizationId === organization.id;

  const familiesQuery = useQuery({
    queryKey: familyQueryKeys.list(organization.id),
    queryFn: () => listFamilies(organization.id),
  });

  const studentsQuery = useQuery({
    queryKey: studentQueryKeys.list(organization.id),
    queryFn: () => listStudents(organization.id),
  });

  const organizationQuery = useQuery({
    queryKey: orgQueryKeys.detail(organization.id),
    queryFn: () => getOrganization(organization.id),
  });

  const peopleQuery = useQuery({
    queryKey: orgQueryKeys.people(organization.id),
    queryFn: () => listOrgPeople(organization.id),
  });

  const members = belongsHere && family ? family : null;
  const occupiedStudentIds = studentIdsInFamilies(familiesQuery.data ?? []);
  const availableStudents = studentsNotIn(
    studentsQuery.data ?? [],
    occupiedStudentIds,
  );
  const availableParents = peopleNotInFamily(
    peopleQuery.data ?? [],
    (members?.parents ?? []).map((parent) => parent.userId),
  ).slice().sort((a, b) => {
    if (a.role === "parent" && b.role !== "parent") return -1;
    if (a.role !== "parent" && b.role === "parent") return 1;
    return a.name.localeCompare(b.name);
  });

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [existingError, setExistingError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [newError, setNewError] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [parentError, setParentError] = useState<string | null>(null);

  const addExistingMutation = useMutation({
    mutationFn: async () => {
      const studentId = Number(selectedStudentId);
      if (!familyReady || !Number.isFinite(studentId) || studentId <= 0) {
        throw new Error("Choose a student to add.");
      }
      const student = availableStudents.find((row) => row.id === studentId);
      if (!student) {
        throw new Error("That student is already in a family.");
      }
      await addFamilyStudent(familyId, student);
    },
    onSuccess: async () => {
      setSelectedStudentId("");
      setExistingError(null);
      await invalidateFamily(queryClient, organization.id, familyId);
      toast("Student added to family.");
    },
    onError: (error: Error) => {
      setExistingError(error.message);
    },
  });

  const addNewMutation = useMutation({
    mutationFn: async () => {
      if (!familyReady) throw new Error("Family isn’t loaded yet.");
      const parsed = validateStudentProfile({
        name,
        parentEmail,
        gradeLevel,
        gradeLabels: organizationQuery.data?.gradeLabels ?? [],
      });
      if (!parsed.ok) throw new Error(parsed.error);
      const student = await createStudent(organization.id, parsed.value);
      await addFamilyStudent(familyId, student);
      return student;
    },
    onSuccess: async () => {
      setName("");
      setParentEmail("");
      setGradeLevel("");
      setNewError(null);
      await invalidateFamily(queryClient, organization.id, familyId);
      toast("Student added to family.");
    },
    onError: (error: Error) => {
      setNewError(error.message);
    },
  });

  const addParentMutation = useMutation({
    mutationFn: async () => {
      if (!familyReady) throw new Error("Family isn’t loaded yet.");
      const person = availableParents.find((row) => row.userId === selectedParentId);
      if (!person) {
        throw new Error("Choose someone with a Course Wright account in this organization.");
      }
      await addFamilyParent(familyId, person);
    },
    onSuccess: async () => {
      setSelectedParentId("");
      setParentError(null);
      await invalidateFamily(queryClient, organization.id, familyId);
      toast("Parent linked to this family.");
    },
    onError: (error: Error) => {
      setParentError(error.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: number) => removeFamilyMember(memberId),
    onSuccess: async () => {
      await invalidateFamily(queryClient, organization.id, familyId);
      toast("Removed from family.");
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

  function onAddParent() {
    setParentError(null);
    addParentMutation.mutate();
  }

  const title =
    belongsHere && family
      ? familyLabel(
          family.displayName,
          familyMemberNames(
            family.students.map((member) => member.student),
            family.parents,
          ),
        )
      : null;

  return {
    organization,
    family: belongsHere ? family : null,
    title,
    students: members?.students ?? [],
    parents: members?.parents ?? [],
    availableStudents,
    availableParents,
    gradeLabels: organizationQuery.data?.gradeLabels ?? [],
    loading: familyQuery.isLoading,
    error: familyQuery.error ? familyQuery.error.message : null,
    notFound: !familyQuery.isLoading && (!family || !belongsHere),
    selectedStudentId,
    existingError,
    name,
    parentEmail,
    gradeLevel,
    newError,
    selectedParentId,
    parentError,
    addingExisting: addExistingMutation.isPending,
    addingNew: addNewMutation.isPending,
    addingParent: addParentMutation.isPending,
    removingId: removeMutation.isPending ? (removeMutation.variables ?? null) : null,
    setSelectedStudentId,
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
    setSelectedParentId: (value: string) => {
      setSelectedParentId(value);
      setParentError(null);
    },
    onAddExisting,
    onAddNew,
    onAddParent,
    onRemove: (memberId: number) => removeMutation.mutate(memberId),
  };
}

async function invalidateFamily(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: number,
  familyId: number,
) {
  await queryClient.invalidateQueries({
    queryKey: familyQueryKeys.list(organizationId),
  });
  await queryClient.invalidateQueries({
    queryKey: familyQueryKeys.detail(familyId),
  });
  await queryClient.invalidateQueries({
    queryKey: studentQueryKeys.list(organizationId),
  });
  await queryClient.invalidateQueries({
    queryKey: orgQueryKeys.people(organizationId),
  });
  await queryClient.invalidateQueries({
    queryKey: ["families", "student"],
  });
}
