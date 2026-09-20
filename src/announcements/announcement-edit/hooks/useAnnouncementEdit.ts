import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import {
  announcementQueryKeys,
  createAnnouncement,
  getAnnouncement,
  listCourseIdsTaughtBy,
  updateAnnouncement,
} from "@/announcements/databridge/announcements";
import {
  announcementPath,
  announcementsPath,
} from "@/announcements/model/paths";
import type { AnnouncementAudience } from "@/announcements/model/audience";
import {
  draftFromSearchParams,
  emptyAnnouncementDraft,
  validateAnnouncementDraft,
  type AnnouncementDraft,
} from "@/announcements/model/validate";
import { courseQueryKeys, listCourses } from "@/courses/databridge/courses";
import { canManageOrgSettings } from "@/organizations/model/role";
import { parentQueryKeys } from "@/parent/databridge/dashboard";
import {
  classQueryKeys,
  listClasses,
} from "@/roster/databridge/classes";
import {
  listStudents,
  studentQueryKeys,
} from "@/roster/databridge/students";

export const ANNOUNCEMENT_FORM_ID = "announcement-form";

export function useAnnouncementEdit() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const announcementId = params.announcementId ? Number(params.announcementId) : NaN;
  const isNew = !Number.isFinite(announcementId);
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canEdit = staffCanEdit(role, parentPresentation);
  const canPickAnyCourse = role ? canManageOrgSettings(role) : false;
  const prefill = useMemo(
    () => draftFromSearchParams(searchParams),
    [searchParams],
  );

  const announcementQuery = useQuery({
    queryKey: announcementQueryKeys.detail(announcementId),
    queryFn: () => getAnnouncement(announcementId, user.id),
    enabled: !isNew && Number.isFinite(announcementId),
  });
  const coursesQuery = useQuery({
    queryKey: courseQueryKeys.list(organization.id),
    queryFn: () => listCourses(organization.id),
    enabled: canEdit,
  });
  const taughtQuery = useQuery({
    queryKey: ["courses", "taught", user.id],
    queryFn: () => listCourseIdsTaughtBy(user.id),
    enabled: canEdit && !canPickAnyCourse,
  });
  const classesQuery = useQuery({
    queryKey: classQueryKeys.list(organization.id),
    queryFn: () => listClasses(organization.id),
    enabled: canEdit,
  });
  const studentsQuery = useQuery({
    queryKey: studentQueryKeys.list(organization.id),
    queryFn: () => listStudents(organization.id),
    enabled: canEdit,
  });

  const loaded = isNew ? null : (announcementQuery.data ?? null);
  const [draft, setDraft] = useState<AnnouncementDraft>(() => ({
    ...emptyAnnouncementDraft(),
    ...prefill,
  }));
  const [hydratedId, setHydratedId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded || hydratedId === loaded.id) return;
    setDraft({
      audience: loaded.audience,
      courseId: loaded.courseId,
      classId: loaded.classId,
      studentId: loaded.studentId,
      title: loaded.title,
      body: loaded.body,
      startDate: loaded.startDate ?? "",
      endDate: loaded.endDate ?? "",
    });
    setHydratedId(loaded.id);
  }, [loaded, hydratedId]);

  const taughtIds = new Set(taughtQuery.data ?? []);
  const courses = (coursesQuery.data ?? []).filter(
    (course) => canPickAnyCourse || taughtIds.has(course.id),
  );
  const classes = classesQuery.data ?? [];
  const students = studentsQuery.data ?? [];

  const initial: AnnouncementDraft = loaded
    ? {
        audience: loaded.audience,
        courseId: loaded.courseId,
        classId: loaded.classId,
        studentId: loaded.studentId,
        title: loaded.title,
        body: loaded.body,
        startDate: loaded.startDate ?? "",
        endDate: loaded.endDate ?? "",
      }
    : { ...emptyAnnouncementDraft(), ...prefill };

  const hasChanges =
    draft.audience !== initial.audience ||
    draft.courseId !== initial.courseId ||
    draft.classId !== initial.classId ||
    draft.studentId !== initial.studentId ||
    draft.title !== initial.title ||
    draft.body !== initial.body ||
    draft.startDate !== initial.startDate ||
    draft.endDate !== initial.endDate;

  function setAudience(audience: AnnouncementAudience) {
    setDraft((current) => ({
      ...current,
      audience,
      courseId: audience === "course" ? current.courseId : null,
      classId: audience === "class" ? current.classId : null,
      studentId: audience === "student" ? current.studentId : null,
    }));
  }

  function invalidate(id: number) {
    void queryClient.invalidateQueries({
      queryKey: announcementQueryKeys.org(organization.id),
    });
    void queryClient.invalidateQueries({
      queryKey: announcementQueryKeys.detail(id),
    });
    void queryClient.invalidateQueries({
      queryKey: parentQueryKeys.dashboard(organization.id, user.id),
    });
  }

  const save = useMutation({
    mutationFn: async () => {
      const message = validateAnnouncementDraft(draft);
      if (message) {
        setFormError(message);
        throw new Error(message);
      }
      setFormError(null);
      if (isNew) {
        return createAnnouncement({
          organizationId: organization.id,
          createdBy: user.id,
          draft,
        });
      }
      await updateAnnouncement(announcementId, draft);
      return { id: announcementId };
    },
    onSuccess: (result) => {
      invalidate(result.id);
      navigate(announcementPath(organization.slug, result.id));
    },
  });

  const belongsHere =
    isNew ||
    (loaded != null &&
      loaded.organizationId === organization.id &&
      loaded.deletedAt == null);

  return {
    organization,
    isNew,
    canEdit,
    title: draft.title,
    body: draft.body,
    startDate: draft.startDate,
    endDate: draft.endDate,
    audience: draft.audience,
    courseId: draft.courseId,
    classId: draft.classId,
    studentId: draft.studentId,
    setTitle: (title: string) => setDraft((current) => ({ ...current, title })),
    setBody: (body: string) => setDraft((current) => ({ ...current, body })),
    setStartDate: (startDate: string) =>
      setDraft((current) => ({ ...current, startDate })),
    setEndDate: (endDate: string) =>
      setDraft((current) => ({ ...current, endDate })),
    setAudience,
    setCourseId: (courseId: number | null) =>
      setDraft((current) => ({ ...current, courseId })),
    setClassId: (classId: number | null) =>
      setDraft((current) => ({ ...current, classId })),
    setStudentId: (studentId: number | null) =>
      setDraft((current) => ({ ...current, studentId })),
    courses,
    classes,
    students,
    hasChanges,
    formError: formError ?? save.error?.message ?? null,
    saving: save.isPending,
    loading:
      coursesQuery.isLoading ||
      classesQuery.isLoading ||
      studentsQuery.isLoading ||
      (!canPickAnyCourse && taughtQuery.isLoading) ||
      (!isNew && announcementQuery.isLoading),
    notFound: !isNew && !announcementQuery.isLoading && !belongsHere,
    onSubmit: (event: FormEvent) => {
      event.preventDefault();
      save.mutate();
    },
    cancelTo: isNew
      ? announcementsPath(organization.slug)
      : announcementPath(organization.slug, announcementId),
  };
}
