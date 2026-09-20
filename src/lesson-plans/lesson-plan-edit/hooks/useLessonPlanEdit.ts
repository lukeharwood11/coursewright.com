import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import {
  createLessonPlan,
  draftFromDetail,
  findLessonPlanForWeek,
  getLessonPlan,
  lessonPlanQueryKeys,
  updateLessonPlan,
  updateLessonPlanVisibility,
} from "@/lesson-plans/databridge/lessonPlans";
import { lessonPlanEditPath, lessonPlanPath } from "@/lesson-plans/model/paths";
import {
  defaultLessonPlanTitle,
  emptyDaysForWeek,
  remapDaysToWeek,
  sundayOnOrBefore,
  validateLessonPlanDraft,
  weekFromParam,
  type LessonPlanDayDraft,
} from "@/lesson-plans/model/validate";
import { toggleMaterialId } from "@/lesson-plans/model/materials";
import type { LessonPlanVisibility } from "@/lesson-plans/model/visibility";
import { getCourse, courseQueryKeys, listCourseInstructors } from "@/courses/databridge/courses";
import { staffCanManageCourse } from "@/courses/model/access";
import { coursePath } from "@/courses/model/paths";
import {
  listMaterialsForCourse,
  materialQueryKeys,
} from "@/materials/databridge/materials";
import { parentQueryKeys } from "@/parent/databridge/dashboard";
import { listUnitsForCourse, unitQueryKeys } from "@/units/databridge/units";

export const LESSON_PLAN_FORM_ID = "lesson-plan-form";

export function useLessonPlanEdit() {
  const params = useParams();
  const [search] = useSearchParams();
  const courseId = params.courseId ? Number(params.courseId) : NaN;
  const lessonPlanId = params.lessonPlanId ? Number(params.lessonPlanId) : NaN;
  const isNew = !Number.isFinite(lessonPlanId);
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const staffEdit = staffCanEdit(role, parentPresentation);
  const requestedWeek = useMemo(() => weekFromParam(search.get("week")), [search]);

  const courseQuery = useQuery({
    queryKey: ["courses", "detail", courseId],
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const instructorsQuery = useQuery({
    queryKey: courseQueryKeys.instructors(courseId),
    queryFn: () => listCourseInstructors(courseId),
    enabled: Number.isFinite(courseId) && staffEdit,
  });
  const existingWeekQuery = useQuery({
    queryKey: [...lessonPlanQueryKeys.course(courseId), requestedWeek.start],
    queryFn: () => findLessonPlanForWeek(courseId, requestedWeek.start),
    enabled: isNew && Number.isFinite(courseId),
  });
  const planQuery = useQuery({
    queryKey: lessonPlanQueryKeys.detail(lessonPlanId),
    queryFn: () => getLessonPlan(lessonPlanId),
    enabled: !isNew && Number.isFinite(lessonPlanId),
  });
  const materialsQuery = useQuery({
    queryKey: materialQueryKeys.list(courseId),
    queryFn: () => listMaterialsForCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const unitsQuery = useQuery({
    queryKey: unitQueryKeys.list(courseId),
    queryFn: () => listUnitsForCourse(courseId),
    enabled: Number.isFinite(courseId),
  });

  const course = courseQuery.data ?? null;
  const canEdit = staffCanManageCourse({
    role,
    parentPresentation,
    userId: user.id,
    instructorUserIds: (instructorsQuery.data ?? []).map((row) => row.userId),
  });
  const loaded = isNew ? null : (planQuery.data ?? null);
  const newTitleDefault = course ? defaultLessonPlanTitle(course.title) : "";
  const [title, setTitle] = useState("");
  const [weekNote, setWeekNote] = useState("");
  const [weekStart, setWeekStart] = useState(requestedWeek.start);
  const [days, setDays] = useState<LessonPlanDayDraft[]>(() =>
    emptyDaysForWeek(requestedWeek.start),
  );
  const [hydratedId, setHydratedId] = useState<number | null>(null);
  const [newTitleApplied, setNewTitleApplied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew || !existingWeekQuery.data) return;
    navigate(
      lessonPlanEditPath(organization.slug, courseId, existingWeekQuery.data.id),
      { replace: true },
    );
  }, [isNew, existingWeekQuery.data, organization.slug, courseId, navigate]);

  useEffect(() => {
    if (!loaded || hydratedId === loaded.id) return;
    const draft = draftFromDetail(loaded);
    setTitle(draft.title);
    setWeekNote(draft.weekNote);
    setWeekStart(draft.weekStart);
    setDays(draft.days);
    setHydratedId(loaded.id);
  }, [loaded, hydratedId]);

  useEffect(() => {
    if (!isNew || !newTitleDefault || newTitleApplied) return;
    setTitle(newTitleDefault);
    setNewTitleApplied(true);
  }, [isNew, newTitleDefault, newTitleApplied]);

  const draft = { title, weekNote, weekStart, days };
  const initial = loaded
    ? draftFromDetail(loaded)
    : {
        title: newTitleDefault,
        weekNote: "",
        weekStart: requestedWeek.start,
        days: emptyDaysForWeek(requestedWeek.start),
      };
  const hasChanges = JSON.stringify(draft) !== JSON.stringify(initial);

  function invalidate(id?: number) {
    void queryClient.invalidateQueries({ queryKey: lessonPlanQueryKeys.course(courseId) });
    void queryClient.invalidateQueries({ queryKey: lessonPlanQueryKeys.org(organization.id) });
    void queryClient.invalidateQueries({
      queryKey: parentQueryKeys.dashboard(organization.id, user.id),
    });
    void queryClient.invalidateQueries({ queryKey: ["calendar", organization.id] });
    const detailId = id ?? (Number.isFinite(lessonPlanId) ? lessonPlanId : null);
    if (detailId) {
      void queryClient.invalidateQueries({
        queryKey: lessonPlanQueryKeys.detail(detailId),
      });
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      const message = validateLessonPlanDraft(draft);
      if (message) {
        setFormError(message);
        throw new Error(message);
      }
      setFormError(null);
      if (isNew) {
        return createLessonPlan({
          organizationId: organization.id,
          courseId,
          createdBy: user.id,
          draft,
        });
      }
      await updateLessonPlan(lessonPlanId, draft);
      return { id: lessonPlanId };
    },
    onSuccess: (result) => {
      invalidate(result.id);
      navigate(lessonPlanPath(organization.slug, courseId, result.id));
    },
  });

  const setVisibility = useMutation({
    mutationFn: (visibility: LessonPlanVisibility) =>
      updateLessonPlanVisibility(lessonPlanId, visibility),
    onSuccess: () => invalidate(),
  });

  const belongsHere =
    course != null &&
    course.organizationId === organization.id &&
    (isNew || (loaded != null && loaded.courseId === courseId && loaded.deletedAt == null));

  return {
    organization,
    courseId,
    isNew,
    canEdit,
    course: belongsHere ? course : null,
    visibility: loaded?.visibility ?? "unpublished",
    title,
    setTitle,
    weekNote,
    setWeekNote,
    weekStart,
    setWeekStart: (next: string) => {
      const sunday = sundayOnOrBefore(next);
      setWeekStart(sunday);
      setDays((current) => remapDaysToWeek(current, sunday));
    },
    days,
    setDayBody: (date: string, body: string) => {
      setDays((current) =>
        current.map((day) => (day.date === date ? { ...day, body } : day)),
      );
    },
    toggleDayMaterial: (date: string, materialId: number) => {
      setDays((current) =>
        current.map((day) =>
          day.date === date
            ? { ...day, materialIds: toggleMaterialId(day.materialIds, materialId) }
            : day,
        ),
      );
    },
    materials: materialsQuery.data ?? [],
    units: unitsQuery.data ?? [],
    hasChanges,
    formError: formError ?? save.error?.message ?? null,
    saving: save.isPending,
    visibilityPending: setVisibility.isPending,
    setVisibility,
    loading:
      courseQuery.isLoading ||
      instructorsQuery.isLoading ||
      materialsQuery.isLoading ||
      unitsQuery.isLoading ||
      (!isNew && planQuery.isLoading) ||
      (isNew && existingWeekQuery.isLoading),
    notFound:
      !courseQuery.isLoading &&
      (!course ||
        course.organizationId !== organization.id ||
        (!isNew && !planQuery.isLoading && !loaded)),
    onSubmit: (event: FormEvent) => {
      event.preventDefault();
      save.mutate();
    },
    cancelTo: isNew
      ? coursePath(organization.slug, courseId)
      : lessonPlanPath(organization.slug, courseId, lessonPlanId),
  };
}
