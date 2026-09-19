import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import {
  bulletinQueryKeys,
  createBulletin,
  getBulletin,
  updateBulletin,
} from "@/bulletins/databridge/bulletins";
import { bulletinPath } from "@/bulletins/model/paths";
import { toggleMaterialId, validateBulletinDraft } from "@/bulletins/model/validate";
import { getCourse } from "@/courses/databridge/courses";
import { coursePath } from "@/courses/model/paths";
import {
  listMaterialsForCourse,
  materialQueryKeys,
} from "@/materials/databridge/materials";
import { parentQueryKeys } from "@/parent/databridge/dashboard";
import { calendarWeekContaining } from "@/parent/model/thisWeek";
import { listUnitsForCourse, unitQueryKeys } from "@/units/databridge/units";

export const BULLETIN_FORM_ID = "bulletin-form";

export function useBulletinEdit() {
  const params = useParams();
  const courseId = params.courseId ? Number(params.courseId) : NaN;
  const bulletinId = params.bulletinId ? Number(params.bulletinId) : NaN;
  const isNew = !Number.isFinite(bulletinId);
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canEdit = staffCanEdit(role, parentPresentation);
  const week = useMemo(() => calendarWeekContaining(), []);

  const courseQuery = useQuery({
    queryKey: ["courses", "detail", courseId],
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const bulletinQuery = useQuery({
    queryKey: bulletinQueryKeys.detail(bulletinId),
    queryFn: () => getBulletin(bulletinId),
    enabled: !isNew && Number.isFinite(bulletinId),
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
  const loaded = isNew ? null : (bulletinQuery.data ?? null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [startDate, setStartDate] = useState(week.start);
  const [endDate, setEndDate] = useState(week.end);
  const [materialIds, setMaterialIds] = useState<number[]>([]);
  const [hydratedId, setHydratedId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded || hydratedId === loaded.id) return;
    setTitle(loaded.title);
    setBody(loaded.body);
    setStartDate(loaded.startDate);
    setEndDate(loaded.endDate);
    setMaterialIds(loaded.materials.map((material) => material.id));
    setHydratedId(loaded.id);
  }, [loaded, hydratedId]);

  const draft = { title, body, startDate, endDate, materialIds };
  const initial = loaded
    ? {
        title: loaded.title,
        body: loaded.body,
        startDate: loaded.startDate,
        endDate: loaded.endDate,
        materialIds: loaded.materials.map((material) => material.id),
      }
    : {
        title: "",
        body: "",
        startDate: week.start,
        endDate: week.end,
        materialIds: [] as number[],
      };
  const hasChanges =
    draft.title !== initial.title ||
    draft.body !== initial.body ||
    draft.startDate !== initial.startDate ||
    draft.endDate !== initial.endDate ||
    draft.materialIds.join(",") !== initial.materialIds.join(",");

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: bulletinQueryKeys.course(courseId) });
    void queryClient.invalidateQueries({ queryKey: bulletinQueryKeys.org(organization.id) });
    void queryClient.invalidateQueries({
      queryKey: parentQueryKeys.dashboard(organization.id, user.id),
    });
    if (Number.isFinite(bulletinId)) {
      void queryClient.invalidateQueries({
        queryKey: bulletinQueryKeys.detail(bulletinId),
      });
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      const message = validateBulletinDraft(draft);
      if (message) {
        setFormError(message);
        throw new Error(message);
      }
      setFormError(null);
      if (isNew) {
        return createBulletin({
          organizationId: organization.id,
          courseId,
          createdBy: user.id,
          draft,
        });
      }
      await updateBulletin(bulletinId, draft);
      return { id: bulletinId };
    },
    onSuccess: (result) => {
      invalidate();
      navigate(bulletinPath(organization.slug, courseId, result.id));
    },
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
    title,
    setTitle,
    body,
    setBody,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    materialIds,
    toggleMaterial: (id: number) => setMaterialIds((current) => toggleMaterialId(current, id)),
    materials: materialsQuery.data ?? [],
    units: unitsQuery.data ?? [],
    hasChanges,
    formError: formError ?? save.error?.message ?? null,
    saving: save.isPending,
    loading:
      courseQuery.isLoading ||
      materialsQuery.isLoading ||
      unitsQuery.isLoading ||
      (!isNew && bulletinQuery.isLoading),
    notFound:
      !courseQuery.isLoading &&
      (!course ||
        course.organizationId !== organization.id ||
        (!isNew && !bulletinQuery.isLoading && !loaded)),
    onSubmit: (event: FormEvent) => {
      event.preventDefault();
      save.mutate();
    },
    cancelTo: isNew
      ? coursePath(organization.slug, courseId)
      : bulletinPath(organization.slug, courseId, bulletinId),
  };
}
