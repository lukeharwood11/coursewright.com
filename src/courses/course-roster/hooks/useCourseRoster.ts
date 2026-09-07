import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { getCourse } from "@/courses/databridge/courses";
import {
  addStudentToCourse,
  enrollmentQueryKeys,
  listCourseEnrollments,
  setEnrollmentStatus,
} from "@/roster/databridge/enrollments";
import { getOrganization, orgQueryKeys } from "@/organizations/databridge/organizations";
import { isStaffRole } from "@/organizations/model/role";

export function useCourseRoster() {
  const { courseId: courseIdParam } = useParams();
  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const { organization, role } = useOrgShell();
  const queryClient = useQueryClient();
  const canEdit = isStaffRole(role);

  const courseQuery = useQuery({
    queryKey: ["courses", "detail", courseId],
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const enrollmentsQuery = useQuery({
    queryKey: enrollmentQueryKeys.course(courseId),
    queryFn: () => listCourseEnrollments(courseId),
    enabled: Number.isFinite(courseId) && canEdit,
  });
  const orgQuery = useQuery({
    queryKey: orgQueryKeys.detail(organization.id),
    queryFn: () => getOrganization(organization.id),
  });

  const [name, setName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  const add = useMutation({
    mutationFn: () => {
      if (!name.trim()) throw new Error("A name is enough to add a student.");
      return addStudentToCourse({
        organizationId: organization.id,
        courseId,
        name: name.trim(),
        parentEmail: parentEmail.trim().toLowerCase() || null,
        gradeLevel: gradeLevel || null,
      });
    },
    onSuccess: async () => {
      setName("");
      setParentEmail("");
      setGradeLevel("");
      await queryClient.invalidateQueries({
        queryKey: enrollmentQueryKeys.course(courseId),
      });
    },
  });

  const unenroll = useMutation({
    mutationFn: (enrollmentId: number) =>
      setEnrollmentStatus(enrollmentId, "withdrawn"),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: enrollmentQueryKeys.course(courseId),
      }),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    add.mutate();
  }

  const course = courseQuery.data ?? null;
  const belongsHere = course?.organizationId === organization.id;

  return {
    organization,
    canEdit,
    course: belongsHere ? course : null,
    enrollments: enrollmentsQuery.data ?? [],
    loading: courseQuery.isLoading || enrollmentsQuery.isLoading,
    notFound: !courseQuery.isLoading && (!course || !belongsHere),
    name,
    setName,
    parentEmail,
    setParentEmail,
    gradeLevel,
    setGradeLevel,
    gradeLabels: orgQuery.data?.gradeLabels ?? [],
    onSubmit,
    adding: add.isPending,
    addError: add.error ? add.error.message : null,
    unenroll,
  };
}
