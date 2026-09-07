import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  addCourseInstructor,
  courseQueryKeys,
  getCourse,
  listCourseInstructors,
  listOrgStaff,
  removeCourseInstructor,
  updateCourse,
  updateCourseVisibility,
} from "@/courses/databridge/courses";
import { validateCourseSettings } from "@/courses/model/createCourse";
import { allowedGradeLevels, toggleGradeLevel } from "@/courses/model/gradeLevels";
import { getOrganization, orgQueryKeys } from "@/organizations/databridge/organizations";
import { canManageOrgSettings, isStaffRole } from "@/organizations/model/role";
import type { CourseVisibility } from "@/courses/model/visibility";

export function useCourseSettings() {
  const { courseId: courseIdParam } = useParams();
  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const { organization, role } = useOrgShell();
  const queryClient = useQueryClient();
  const canEdit = isStaffRole(role);
  const canManageInstructors = canManageOrgSettings(role);

  const courseQuery = useQuery({
    queryKey: courseQueryKeys.detail(courseId),
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const orgQuery = useQuery({
    queryKey: orgQueryKeys.detail(organization.id),
    queryFn: () => getOrganization(organization.id),
  });
  const instructorsQuery = useQuery({
    queryKey: courseQueryKeys.instructors(courseId),
    queryFn: () => listCourseInstructors(courseId),
    enabled: Number.isFinite(courseId),
  });
  const staffQuery = useQuery({
    queryKey: ["org-staff", organization.id],
    queryFn: () => listOrgStaff(organization.id),
    enabled: canManageInstructors,
  });

  const course = courseQuery.data ?? null;
  const belongsHere = course?.organizationId === organization.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [subject, setSubject] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("active");
  const [gradeLevels, setGradeLevels] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [addUserId, setAddUserId] = useState("");

  useEffect(() => {
    if (!course) return;
    setTitle(course.title);
    setDescription(course.description);
    setLocation(course.location);
    setSubject(course.subject);
    setStartDate(course.startDate ?? "");
    setEndDate(course.endDate ?? "");
    setStatus(course.status);
    setGradeLevels(course.gradeLevels);
  }, [course]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = validateCourseSettings({
        title,
        description,
        location,
        subject,
        startDate,
        endDate,
        gradeLevels: allowedGradeLevels(
          gradeLevels,
          orgQuery.data?.gradeLabels ?? [],
        ),
        status,
      });
      if (!parsed.ok) throw new Error(parsed.error);
      return updateCourse(courseId, parsed.value);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.detail(courseId),
      });
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.list(organization.id),
      });
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const setVisibility = useMutation({
    mutationFn: (visibility: CourseVisibility) =>
      updateCourseVisibility(courseId, visibility),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.detail(courseId),
      });
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.list(organization.id),
      });
    },
  });

  const addInstructor = useMutation({
    mutationFn: () => addCourseInstructor(courseId, addUserId),
    onSuccess: async () => {
      setAddUserId("");
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.instructors(courseId),
      });
    },
  });

  const removeInstructor = useMutation({
    mutationFn: (userId: string) => removeCourseInstructor(courseId, userId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: courseQueryKeys.instructors(courseId),
      }),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    save.mutate();
  }

  const instructorIds = new Set((instructorsQuery.data ?? []).map((row) => row.userId));

  return {
    organization,
    canEdit,
    canManageInstructors,
    course: belongsHere ? course : null,
    loading: courseQuery.isLoading,
    notFound: !courseQuery.isLoading && (!course || !belongsHere),
    title,
    setTitle,
    description,
    setDescription,
    location,
    setLocation,
    subject,
    setSubject,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    status,
    setStatus,
    gradeLevels,
    toggleGrade: (label: string) =>
      setGradeLevels((current) => toggleGradeLevel(current, label)),
    gradeLabels: orgQuery.data?.gradeLabels ?? [],
    formError: formError ?? (save.error ? save.error.message : null),
    saving: save.isPending,
    onSubmit,
    instructors: instructorsQuery.data ?? [],
    staff: (staffQuery.data ?? []).filter((row) => !instructorIds.has(row.userId)),
    addUserId,
    setAddUserId,
    addInstructor,
    removeInstructor,
    setVisibility,
    copiedFromCourseId: course?.copiedFromCourseId ?? null,
  };
}
