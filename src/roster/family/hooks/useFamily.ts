import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import {
  listOrgPeople,
  orgQueryKeys,
} from "@/organizations/databridge/memberships";
import { getOrganization } from "@/organizations/databridge/organizations";
import {
  addFamilyStudent,
  createParentInvites,
  ensureParentStudentLinks,
  familyQueryKeys,
  getFamily,
  listFamilies,
  removeFamilyMember,
} from "@/roster/databridge/families";
import { createStudent, listStudents, studentQueryKeys } from "@/roster/databridge/students";
import {
  familyLabel,
  familyMemberNames,
  findPersonByEmail,
  parseParentEmail,
  studentIdsInFamilies,
} from "@/roster/model/family";
import { studentsNotIn, validateStudentProfile } from "@/roster/model/studentProfile";

const ALL_STUDENTS = "all";

export function useFamily() {
  const { familyId: familyIdParam } = useParams();
  const familyId = familyIdParam ? Number(familyIdParam) : NaN;
  const { organization } = useOrgShell();
  const user = useAuthedUser();
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
  const orgPeople = (peopleQuery.data ?? []).slice().sort((a, b) => {
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
  const [linkStudentId, setLinkStudentId] = useState(ALL_STUDENTS);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [linkEmail, setLinkEmail] = useState("");
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
      const familyStudents = members?.students ?? [];
      if (familyStudents.length === 0) {
        throw new Error("Add a student before linking a parent.");
      }

      const targetIds =
        familyStudents.length === 1 || linkStudentId === ALL_STUDENTS
          ? familyStudents.map((member) => member.student.id)
          : [Number(linkStudentId)].filter((id) => Number.isFinite(id) && id > 0);

      if (targetIds.length === 0) {
        throw new Error("Choose a student to link this parent to.");
      }

      const parsedEmail = parseParentEmail(linkEmail);
      if (!parsedEmail.ok) throw new Error(parsedEmail.error);

      const selectedPerson = orgPeople.find((row) => row.userId === selectedParentId);
      const emailedPerson = parsedEmail.email
        ? findPersonByEmail(orgPeople, parsedEmail.email)
        : null;
      const person = selectedPerson ?? emailedPerson;

      if (person) {
        await ensureParentStudentLinks(person.userId, targetIds);
        return "linked" as const;
      }

      if (!parsedEmail.email) {
        throw new Error("Choose someone in this organization, or enter a parent email.");
      }

      await createParentInvites({
        organizationId: organization.id,
        email: parsedEmail.email,
        studentIds: targetIds,
        invitedBy: user.id,
      });
      return "invited" as const;
    },
    onSuccess: async (result) => {
      setSelectedParentId("");
      setLinkEmail("");
      setParentError(null);
      await invalidateFamily(queryClient, organization.id, familyId);
      toast(
        result === "invited"
          ? "Invite saved for that email. Sending it is still a separate step."
          : "Parent linked to the student.",
      );
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
          familyMemberNames(family.students.map((member) => member.student)),
        )
      : null;

  return {
    organization,
    family: belongsHere ? family : null,
    title,
    students: members?.students ?? [],
    parents: members?.parents ?? [],
    pendingInvites: members?.pendingInvites ?? [],
    availableStudents,
    orgPeople,
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
    linkStudentId,
    selectedParentId,
    linkEmail,
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
    setLinkStudentId,
    setSelectedParentId: (value: string) => {
      setSelectedParentId(value);
      setParentError(null);
    },
    setLinkEmail: (value: string) => {
      setLinkEmail(value);
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
