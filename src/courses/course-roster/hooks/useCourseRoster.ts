import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { courseQueryKeys, getCourse } from "@/courses/databridge/courses";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import { getOrganization } from "@/organizations/databridge/organizations";
import { isStaffRole } from "@/organizations/model/role";
import {
  enrollStudent,
  enrollmentQueryKeys,
  listCourseEnrollments,
  unenrollStudent,
} from "@/roster/databridge/enrollments";
import { createStudent, listStudents, studentQueryKeys } from "@/roster/databridge/students";
import { studentsNotIn, validateStudentProfile } from "@/roster/model/studentProfile";

export function useCourseRoster() {
  const { courseId: courseIdParam } = useParams();
  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const { organization, role } = useOrgShell();
  const queryClient = useQueryClient();
  const canEdit = isStaffRole(role);
  const courseReady = Number.isFinite(courseId);

  const courseQuery = useQuery({
    queryKey: courseQueryKeys.detail(courseId),
    queryFn: () => getCourse(courseId),
    enabled: courseReady,
  });

  const course = courseQuery.data ?? null;
  const belongsHere = course?.organizationId === organization.id;

  const enrollmentsQuery = useQuery({
    queryKey: enrollmentQueryKeys.course(courseId),
    queryFn: () => listCourseEnrollments(courseId),
    enabled: courseReady && belongsHere && canEdit,
  });

  const studentsQuery = useQuery({
    queryKey: studentQueryKeys.list(organization.id),
    queryFn: () => listStudents(organization.id),
    enabled: canEdit,
  });

  const organizationQuery = useQuery({
    queryKey: orgQueryKeys.detail(organization.id),
    queryFn: () => getOrganization(organization.id),
  });

  const enrollments = enrollmentsQuery.data ?? [];
  const availableStudents = studentsNotIn(
    studentsQuery.data ?? [],
    enrollments.map((enrollment) => enrollment.student.id),
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
      if (!courseReady || !Number.isFinite(studentId) || studentId <= 0) {
        throw new Error("Choose a student to add.");
      }
      await enrollStudent(courseId, studentId);
    },
    onSuccess: async () => {
      setSelectedId("");
      setExistingError(null);
      await invalidateCourseRoster(queryClient, organization.id, courseId);
      toast("Student enrolled.");
    },
    onError: (error: Error) => {
      setExistingError(error.message);
    },
  });

  const addNewMutation = useMutation({
    mutationFn: async () => {
      if (!courseReady) throw new Error("Course isn’t loaded yet.");
      const parsed = validateStudentProfile({
        name,
        parentEmail,
        gradeLevel,
        gradeLabels: organizationQuery.data?.gradeLabels ?? [],
      });
      if (!parsed.ok) throw new Error(parsed.error);
      const student = await createStudent(organization.id, parsed.value, courseId);
      await enrollStudent(courseId, student.id);
      return student;
    },
    onSuccess: async () => {
      setName("");
      setParentEmail("");
      setGradeLevel("");
      setNewError(null);
      await invalidateCourseRoster(queryClient, organization.id, courseId);
      toast("Student enrolled.");
    },
    onError: (error: Error) => {
      setNewError(error.message);
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: (enrollmentId: number) => unenrollStudent(enrollmentId),
    onSuccess: async () => {
      await invalidateCourseRoster(queryClient, organization.id, courseId);
      toast("Student unenrolled.");
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
    canEdit,
    course: belongsHere ? course : null,
    enrollments,
    availableStudents,
    gradeLabels: organizationQuery.data?.gradeLabels ?? [],
    loading: courseQuery.isLoading || enrollmentsQuery.isLoading,
    error: courseQuery.error
      ? courseQuery.error.message
      : enrollmentsQuery.error
        ? enrollmentsQuery.error.message
        : null,
    notFound: !courseQuery.isLoading && (!course || !belongsHere),
    selectedId,
    existingError,
    name,
    parentEmail,
    gradeLevel,
    newError,
    addingExisting: addExistingMutation.isPending,
    addingNew: addNewMutation.isPending,
    unenrollingId: unenrollMutation.isPending
      ? (unenrollMutation.variables ?? null)
      : null,
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
    onUnenroll: (enrollmentId: number) => unenrollMutation.mutate(enrollmentId),
  };
}

async function invalidateCourseRoster(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: number,
  courseId: number,
) {
  await queryClient.invalidateQueries({
    queryKey: studentQueryKeys.list(organizationId),
  });
  await queryClient.invalidateQueries({
    queryKey: enrollmentQueryKeys.course(courseId),
  });
}
