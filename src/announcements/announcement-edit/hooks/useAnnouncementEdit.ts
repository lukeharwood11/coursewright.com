import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { formOrMutationError, toastCaughtError } from "@/ui/toast";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import {
  announcementQueryKeys,
  createAnnouncement,
  getAnnouncement,
  listCourseIdsTaughtBy,
  sendAnnouncementNotification,
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
  sameIdList,
  toggleDraftId,
  validateAnnouncementDraft,
  announcementDraftHasTitleAndTargets,
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

function draftFromRecord(loaded: {
  audience: AnnouncementAudience;
  courseIds: number[];
  classIds: number[];
  studentIds: number[];
  title: string;
  body: string;
  startDate: string | null;
  endDate: string | null;
}): AnnouncementDraft {
  return {
    audience: loaded.audience,
    courseIds: loaded.courseIds,
    classIds: loaded.classIds,
    studentIds: loaded.studentIds,
    title: loaded.title,
    body: loaded.body,
    startDate: loaded.startDate ?? "",
    endDate: loaded.endDate ?? "",
  };
}

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
  const [sendNotification, setSendNotification] = useState(false);
  const [hydratedId, setHydratedId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded || hydratedId === loaded.id) return;
    setDraft(draftFromRecord(loaded));
    setHydratedId(loaded.id);
  }, [loaded, hydratedId]);

  const taughtIds = new Set(taughtQuery.data ?? []);
  const courses = (coursesQuery.data ?? []).filter(
    (course) => canPickAnyCourse || taughtIds.has(course.id),
  );
  const classes = classesQuery.data ?? [];
  const students = studentsQuery.data ?? [];

  const initial: AnnouncementDraft = loaded
    ? draftFromRecord(loaded)
    : { ...emptyAnnouncementDraft(), ...prefill };

  const hasChanges =
    draft.audience !== initial.audience ||
    !sameIdList(draft.courseIds, initial.courseIds) ||
    !sameIdList(draft.classIds, initial.classIds) ||
    !sameIdList(draft.studentIds, initial.studentIds) ||
    draft.title !== initial.title ||
    draft.body !== initial.body ||
    draft.startDate !== initial.startDate ||
    draft.endDate !== initial.endDate ||
    sendNotification;

  const canSave = announcementDraftHasTitleAndTargets(draft);

  function setAudience(audience: AnnouncementAudience) {
    setDraft((current) => ({
      ...current,
      audience,
      courseIds: audience === "course" ? current.courseIds : [],
      classIds: audience === "class" ? current.classIds : [],
      studentIds: audience === "student" ? current.studentIds : [],
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
      const saved = isNew
        ? await createAnnouncement({
            organizationId: organization.id,
            createdBy: user.id,
            draft,
          })
        : await updateAnnouncement(announcementId, draft).then(() => ({
            id: announcementId,
          }));
      if (!sendNotification) {
        return { id: saved.id, email: null };
      }
      const email = await sendAnnouncementNotification(saved.id);
      return { id: saved.id, email };
    },
    onSuccess: (result) => {
      invalidate(result.id);
      if (result.email?.error) {
        toastCaughtError(result.email.error);
      } else if (result.email && result.email.sent > 0) {
        toast("Notification emailed to students.");
      }
      navigate(announcementPath(organization.slug, result.id));
    },
    onError: (error: Error) => toastCaughtError(error),
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
    courseIds: draft.courseIds,
    classIds: draft.classIds,
    studentIds: draft.studentIds,
    setTitle: (title: string) => setDraft((current) => ({ ...current, title })),
    setBody: (body: string) => setDraft((current) => ({ ...current, body })),
    setStartDate: (startDate: string) =>
      setDraft((current) => ({ ...current, startDate })),
    setEndDate: (endDate: string) =>
      setDraft((current) => ({ ...current, endDate })),
    sendNotification,
    setSendNotification,
    setAudience,
    toggleCourseId: (id: number) =>
      setDraft((current) => toggleDraftId(current, "courseIds", id)),
    toggleClassId: (id: number) =>
      setDraft((current) => toggleDraftId(current, "classIds", id)),
    toggleStudentId: (id: number) =>
      setDraft((current) => toggleDraftId(current, "studentIds", id)),
    courses,
    classes,
    students,
    hasChanges,
    canSave,
    formError: formOrMutationError(formError, save.error),
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
