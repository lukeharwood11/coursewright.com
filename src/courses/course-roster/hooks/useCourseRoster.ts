import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  caughtErrorMessage,
  toastCaughtError,
  toastCheckNetworkConnection,
} from "@/ui/toast";
import { isNetworkError } from "@/ui/networkError";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  addCourseInstructor,
  courseQueryKeys,
  getCourse,
  listCourseInstructors,
  listOrgStaffForPicker,
  removeCourseInstructor,
} from "@/courses/databridge/courses";
import { staffCanManageCourse, staffCanViewCourse } from "@/courses/model/access";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import { getOrganization } from "@/organizations/databridge/organizations";
import { canManageOrgSettings } from "@/organizations/model/role";
import {
  classQueryKeys,
  listClasses,
  listClassMembers,
} from "@/roster/databridge/classes";
import {
  enrollStudents,
  enrollmentQueryKeys,
  listCourseEnrollments,
  unenrollStudent,
} from "@/roster/databridge/enrollments";
import { inviteCreatedStudents } from "@/roster/databridge/studentInvites";
import {
  createStudents,
  listStudents,
  studentQueryKeys,
} from "@/roster/databridge/students";
import {
  emptyStudentDraft,
  mergeSelectedIds,
  parseStudentNamesPaste,
  studentsNotIn,
  toggleIdInSet,
  validateStudentBatch,
  withInviteNote,
  type NewStudentDraft,
} from "@/roster/model/studentProfile";

export function useCourseRoster() {
  const { courseId: courseIdParam } = useParams();
  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const courseReady = Number.isFinite(courseId);
  const [addUserId, setAddUserId] = useState("");
  const canManageInstructors = canManageOrgSettings(role);

  const courseQuery = useQuery({
    queryKey: courseQueryKeys.detail(courseId),
    queryFn: () => getCourse(courseId),
    enabled: courseReady,
  });
  const instructorsQuery = useQuery({
    queryKey: courseQueryKeys.instructors(courseId),
    queryFn: () => listCourseInstructors(courseId),
    enabled: courseReady,
  });

  const course = courseQuery.data ?? null;
  const belongsHere = course?.organizationId === organization.id;
  const instructorUserIds = (instructorsQuery.data ?? []).map((row) => row.userId);
  const canEdit = staffCanManageCourse({
    role,
    parentPresentation,
    userId: user.id,
    instructorUserIds,
  });
  const canView = staffCanViewCourse({
    role,
    parentPresentation,
    userId: user.id,
    instructorUserIds,
  });

  const enrollmentsQuery = useQuery({
    queryKey: enrollmentQueryKeys.course(courseId),
    queryFn: () => listCourseEnrollments(courseId),
    enabled: courseReady && belongsHere && canView,
  });

  const studentsQuery = useQuery({
    queryKey: studentQueryKeys.list(organization.id),
    queryFn: () => listStudents(organization.id),
    enabled: canEdit,
  });

  const classesQuery = useQuery({
    queryKey: classQueryKeys.list(organization.id),
    queryFn: () => listClasses(organization.id),
    enabled: canView,
  });

  const organizationQuery = useQuery({
    queryKey: orgQueryKeys.detail(organization.id),
    queryFn: () => getOrganization(organization.id),
  });

  const staffQuery = useQuery({
    queryKey: ["courses", "org-staff-picker", organization.id],
    queryFn: () => listOrgStaffForPicker(organization.id),
    enabled: canManageInstructors,
  });

  const enrollments = enrollmentsQuery.data ?? [];
  const availableStudents = studentsNotIn(
    studentsQuery.data ?? [],
    enrollments.map((enrollment) => enrollment.student.id),
  );

  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [existingError, setExistingError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<NewStudentDraft[]>([emptyStudentDraft()]);
  const [pasteText, setPasteText] = useState("");
  const [newError, setNewError] = useState<string | null>(null);

  const enrollExistingMutation = useMutation({
    mutationFn: async () => {
      if (!courseReady) throw new Error("Course isn’t loaded yet.");
      if (selectedIds.length === 0) {
        throw new Error("Choose at least one student to enroll.");
      }
      await enrollStudents(courseId, selectedIds);
      return selectedIds.length;
    },
    onSuccess: async (count) => {
      setSelectedIds([]);
      setSelectedClassId("");
      setExistingError(null);
      setPanelOpen(false);
      await invalidateCourseRoster(queryClient, organization.id, courseId);
      toast(count === 1 ? "Student enrolled." : `${count} students enrolled.`);
    },
    onError: (error: Error) => {
      setExistingError(caughtErrorMessage(error));
    },
  });

  const enrollNewMutation = useMutation({
    mutationFn: async () => {
      if (!courseReady) throw new Error("Course isn’t loaded yet.");
      const parsed = validateStudentBatch(
        drafts,
        organizationQuery.data?.gradeLabels ?? [],
      );
      if (!parsed.ok) throw new Error(parsed.error);
      const created = await createStudents(
        organization.id,
        parsed.values,
        courseId,
      );
      await enrollStudents(
        courseId,
        created.map((student) => student.id),
      );
      const invites = await inviteCreatedStudents({
        organizationId: organization.id,
        students: created,
        invitedBy: user.id,
      });
      return { count: created.length, invites };
    },
    onSuccess: async ({ count, invites }) => {
      setDrafts([emptyStudentDraft()]);
      setPasteText("");
      setNewError(null);
      setPanelOpen(false);
      await invalidateCourseRoster(queryClient, organization.id, courseId);
      toast(
        withInviteNote(
          count === 1 ? "Student enrolled." : `${count} students enrolled.`,
          invites,
        ),
      );
    },
    onError: (error: Error) => {
      setNewError(caughtErrorMessage(error));
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: (enrollmentId: number) => unenrollStudent(enrollmentId),
    onSuccess: async () => {
      await invalidateCourseRoster(queryClient, organization.id, courseId);
      toast("Student unenrolled.");
    },
    onError: (error: Error) => {
      toastCaughtError(error);
    },
  });

  const addInstructorMutation = useMutation({
    mutationFn: () => addCourseInstructor(courseId, addUserId),
    onSuccess: async () => {
      setAddUserId("");
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.instructors(courseId),
      });
      toast("Teacher added.");
    },
    onError: (error: Error) => {
      if (isNetworkError(error)) toastCheckNetworkConnection();
    },
  });

  const removeInstructorMutation = useMutation({
    mutationFn: (userId: string) => removeCourseInstructor(courseId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.instructors(courseId),
      });
      toast("Teacher removed.");
    },
    onError: (error: Error) => {
      toastCaughtError(error);
    },
  });

  async function onSelectClass(classIdValue: string) {
    setSelectedClassId(classIdValue);
    setExistingError(null);
    if (!classIdValue) return;
    const classId = Number(classIdValue);
    if (!Number.isFinite(classId)) return;
    try {
      const members = await listClassMembers(classId);
      const eligible = new Set(availableStudents.map((student) => student.id));
      const fromClass = members
        .map((member) => member.student.id)
        .filter((id) => eligible.has(id));
      setSelectedIds((current) => mergeSelectedIds(current, fromClass));
    } catch (error) {
      setExistingError(caughtErrorMessage(error));
    }
  }

  function onSubmitNew(event: FormEvent) {
    event.preventDefault();
    setNewError(null);
    enrollNewMutation.mutate();
  }

  function onApplyPaste() {
    const names = parseStudentNamesPaste(pasteText);
    if (names.length === 0) return;
    setDrafts((current) => {
      const next = [...current];
      const firstBlank = next.findIndex((draft) => !draft.name.trim());
      let writeAt = firstBlank >= 0 ? firstBlank : next.length;
      for (const name of names) {
        if (writeAt < next.length) {
          next[writeAt] = { ...next[writeAt], name };
        } else {
          next.push({ ...emptyStudentDraft(), name });
        }
        writeAt += 1;
      }
      return next.length > 0 ? next : [emptyStudentDraft()];
    });
    setPasteText("");
    setNewError(null);
  }

  const instructorIds = new Set(
    (instructorsQuery.data ?? []).map((row) => row.userId),
  );

  return {
    organization,
    canEdit,
    canView,
    canManageInstructors,
    course: belongsHere ? course : null,
    enrollments,
    instructors: instructorsQuery.data ?? [],
    staff: (staffQuery.data ?? []).filter((row) => !instructorIds.has(row.userId)),
    addUserId,
    setAddUserId,
    addInstructor: () => addInstructorMutation.mutate(),
    addingInstructor: addInstructorMutation.isPending,
    addInstructorError:
      addInstructorMutation.error && !isNetworkError(addInstructorMutation.error)
        ? addInstructorMutation.error.message
        : null,
    onRemoveInstructor: (userId: string) =>
      removeInstructorMutation.mutate(userId),
    availableStudents,
    classes: classesQuery.data ?? [],
    gradeLabels: organizationQuery.data?.gradeLabels ?? [],
    loading:
      courseQuery.isLoading ||
      instructorsQuery.isLoading ||
      enrollmentsQuery.isLoading,
    error: courseQuery.error
      ? courseQuery.error.message
      : enrollmentsQuery.error
        ? enrollmentsQuery.error.message
        : null,
    notFound: !courseQuery.isLoading && (!course || !belongsHere),
    panelOpen,
    tab,
    selectedIds,
    selectedClassId,
    existingError,
    drafts,
    pasteText,
    newError,
    addingExisting: enrollExistingMutation.isPending,
    addingNew: enrollNewMutation.isPending,
    unenrollingId: unenrollMutation.isPending
      ? (unenrollMutation.variables ?? null)
      : null,
    openPanel: () => {
      setPanelOpen(true);
      setTab(availableStudents.length === 0 ? "new" : "existing");
    },
    closePanel: () => {
      setPanelOpen(false);
      setExistingError(null);
      setNewError(null);
    },
    setTab,
    onToggle: (id: number) => {
      setSelectedIds((current) => toggleIdInSet(current, id));
      setExistingError(null);
    },
    onSelectFiltered: (ids: number[]) => {
      setSelectedIds((current) => mergeSelectedIds(current, ids));
      setExistingError(null);
    },
    onClearSelection: () => {
      setSelectedIds([]);
      setSelectedClassId("");
      setExistingError(null);
    },
    onSelectClass,
    onConfirmExisting: () => {
      setExistingError(null);
      enrollExistingMutation.mutate();
    },
    setDraft: (index: number, draft: NewStudentDraft) => {
      setDrafts((current) =>
        current.map((row, rowIndex) => (rowIndex === index ? draft : row)),
      );
      setNewError(null);
    },
    onAddRow: () => {
      setDrafts((current) => [...current, emptyStudentDraft()]);
      setNewError(null);
    },
    onRemoveRow: (index: number) => {
      setDrafts((current) =>
        current.length <= 1
          ? [emptyStudentDraft()]
          : current.filter((_, rowIndex) => rowIndex !== index),
      );
      setNewError(null);
    },
    setPasteText: (value: string) => {
      setPasteText(value);
      setNewError(null);
    },
    onApplyPaste,
    onSubmitNew,
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
  await queryClient.invalidateQueries({
    queryKey: courseQueryKeys.list(organizationId),
  });
  await queryClient.invalidateQueries({
    queryKey: courseQueryKeys.listWithCatalog(organizationId),
  });
}
