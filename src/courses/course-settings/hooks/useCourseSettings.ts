import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanManageCourse } from "@/courses/model/access";
import {
  caughtErrorMessage,
  formOrMutationError,
} from "@/ui/toast";
import {
  addCourseInstructor,
  courseQueryKeys,
  getCourse,
  listCourseInstructors,
  listOrgStaffForPicker,
  removeCourseInstructor,
  updateCourse,
  updateCourseVisibility,
} from "@/courses/databridge/courses";
import {
  courseSettingsHaveChanges,
  validateCourseSettings,
} from "@/courses/model/createCourse";
import { allowedGradeLevels, toggleGradeLevel } from "@/courses/model/gradeLevels";
import { getOrganization, orgQueryKeys } from "@/organizations/databridge/organizations";
import { canManageOrgSettings } from "@/organizations/model/role";
import type { CourseIconValue } from "@/courses/model/courseIcon";
import type { CourseColorKey } from "@/courses/model/courseColor";
import { parseCourseColorKey } from "@/courses/model/courseColor";
import type { CourseVisibility } from "@/courses/model/visibility";

export const COURSE_SETTINGS_FORM_ID = "course-settings-form";

export function useCourseSettings() {
  const { courseId: courseIdParam } = useParams();
  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const queryClient = useQueryClient();
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
    // Distinct from org-settings staff list (`["org-staff", id]`), which includes membershipId.
    queryKey: ["courses", "org-staff-picker", organization.id],
    queryFn: () => listOrgStaffForPicker(organization.id),
    enabled: canManageInstructors,
  });

  const course = courseQuery.data ?? null;
  const belongsHere = course?.organizationId === organization.id;
  const canEdit = staffCanManageCourse({
    role,
    parentPresentation,
    userId: user.id,
    instructorUserIds: (instructorsQuery.data ?? []).map((row) => row.userId),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [subject, setSubject] = useState("");
  const [iconKey, setIconKey] = useState<CourseIconValue>(null);
  const [colorKey, setColorKey] = useState<CourseColorKey>("moss");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("active");
  const [gradeLevels, setGradeLevels] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [addUserId, setAddUserId] = useState("");

  const resetForm = useCallback(() => {
    if (!course) return;
    setTitle(course.title);
    setDescription(course.description);
    setLocation(course.location);
    setSubject(course.subject);
    setIconKey(course.iconKey);
    setColorKey(parseCourseColorKey(course.colorKey));
    setStartDate(course.startDate ?? "");
    setEndDate(course.endDate ?? "");
    setStatus(course.status);
    setGradeLevels(course.gradeLevels);
    setFormError(null);
  }, [course]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = validateCourseSettings({
        title,
        description,
        location,
        subject,
        iconKey,
        colorKey,
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
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.detail(courseId),
      });
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.list(organization.id),
      });
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.listWithCatalog(organization.id),
      });
      await queryClient.invalidateQueries({ queryKey: ["calendar", organization.id] });
      await queryClient.invalidateQueries({ queryKey: ["parent", "dashboard", organization.id] });
    },
    onError: (error: Error) => setFormError(caughtErrorMessage(error)),
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
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.listWithCatalog(organization.id),
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

  const hasChanges = course
    ? courseSettingsHaveChanges(
        {
          title,
          description,
          location,
          subject,
          iconKey,
          colorKey,
          startDate,
          endDate,
          gradeLevels,
          status,
        },
        course,
      )
    : false;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!hasChanges) return;
    setFormError(null);
    save.mutate();
  }

  const instructorIds = new Set((instructorsQuery.data ?? []).map((row) => row.userId));

  return {
    organization,
    canEdit,
    canManageInstructors,
    course: belongsHere ? course : null,
    loading: courseQuery.isLoading || instructorsQuery.isLoading,
    notFound: !courseQuery.isLoading && (!course || !belongsHere),
    title,
    setTitle,
    description,
    setDescription,
    location,
    setLocation,
    subject,
    setSubject,
    iconKey,
    setIconKey,
    colorKey,
    setColorKey,
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
    formError: formOrMutationError(formError, save.error),
    saving: save.isPending,
    hasChanges,
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
