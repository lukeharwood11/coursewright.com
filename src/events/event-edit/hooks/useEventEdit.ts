import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { SerializedEditorState } from "lexical";
import { toast } from "sonner";
import { toastCaughtError } from "@/ui/toast";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import { courseQueryKeys, listCourses } from "@/courses/databridge/courses";
import {
  createEvent,
  eventQueryKeys,
  getEvent,
  listCourseIdsTaughtBy,
  saveEventBlocks,
  saveEventMaterials,
  updateEvent,
} from "@/events/databridge/events";
import { eventPath } from "@/events/model/paths";
import { normalizeTimeInput } from "@/events/model/schedule";
import {
  canEditEventAudience,
  draftFromSearchParams,
  emptyEventDraft,
  toggleDraftId,
  validateEventDraft,
  type EventDraft,
} from "@/events/model/validate";
import type { EventAudience } from "@/events/model/audience";
import { listMaterialsForCourse } from "@/materials/databridge/materials";
import { editorStateToBlocks } from "@/materials/model/pageContent";
import { canManageOrgSettings } from "@/organizations/model/role";
import { parentQueryKeys } from "@/parent/databridge/dashboard";
import { classQueryKeys, listClasses } from "@/roster/databridge/classes";

export const EVENT_FORM_ID = "event-form";

function timeInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 5);
}

export function useEventEdit() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const eventId = params.eventId ? Number(params.eventId) : NaN;
  const isNew = !Number.isFinite(eventId);
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canEdit = staffCanEdit(role, parentPresentation);
  const canPickAnyCourse = role ? canManageOrgSettings(role) : false;
  const prefill = useMemo(() => draftFromSearchParams(searchParams), [searchParams]);

  const eventQuery = useQuery({
    queryKey: eventQueryKeys.detail(eventId),
    queryFn: () => getEvent(eventId),
    enabled: !isNew && Number.isFinite(eventId),
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

  const loaded = isNew ? null : (eventQuery.data ?? null);
  const [draft, setDraft] = useState<EventDraft>(() => ({
    ...emptyEventDraft(),
    ...prefill,
  }));
  const [lexicalJson, setLexicalJson] = useState<string | null>(null);
  const initialLexical = useRef<string | null>(null);
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify({ ...emptyEventDraft(), ...prefill }),
  );
  const [hydratedId, setHydratedId] = useState<number | null>(null);

  useEffect(() => {
    if (!loaded || hydratedId === loaded.id) return;
    const next = {
      audience: loaded.audience,
      courseIds: loaded.courseIds,
      classIds: loaded.classIds,
      title: loaded.title,
      location: loaded.location,
      startsOn: loaded.startsOn,
      endsOn: loaded.endsOn ?? "",
      startTime: timeInputValue(loaded.startTime),
      endTime: timeInputValue(loaded.endTime),
      materialIds: loaded.materials.map((material) => material.id),
    };
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setHydratedId(loaded.id);
  }, [hydratedId, loaded]);

  const taughtCourseIds = taughtQuery.data ?? [];
  const courseOptions = (coursesQuery.data ?? [])
    .filter((course) => canPickAnyCourse || taughtCourseIds.includes(course.id))
    .map((course) => ({ id: course.id, name: course.title }));
  const classOptions = (classesQuery.data ?? []).map((group) => ({
    id: group.id,
    name: group.title,
  }));

  const materialCourseIds =
    draft.audience === "course"
      ? draft.courseIds
      : courseOptions.map((course) => course.id);

  const materialsQuery = useQuery({
    queryKey: ["events", "material-options", [...materialCourseIds].sort((a, b) => a - b).join(",")],
    queryFn: async () => {
      const lists = await Promise.all(
        materialCourseIds.map(async (courseId) => {
          const materials = await listMaterialsForCourse(courseId);
          const courseTitle =
            courseOptions.find((course) => course.id === courseId)?.name ?? "Course";
          return materials.map((material) => ({
            id: material.id,
            title: material.title,
            courseTitle,
          }));
        }),
      );
      return lists.flat().sort((a, b) => a.title.localeCompare(b.title));
    },
    enabled: canEdit && materialCourseIds.length > 0,
  });

  const allowedToSave = canEditEventAudience({
    audience: draft.audience,
    courseIds: draft.courseIds,
    canPickAnyCourse,
    taughtCourseIds,
    isStaff: canEdit,
  });

  const save = useMutation({
    mutationFn: async () => {
      const message = validateEventDraft(draft);
      if (message) throw new Error(message);
      if (!allowedToSave) throw new Error("You can’t change this event.");
      const write = {
        organizationId: organization.id,
        audience: draft.audience,
        courseIds: draft.courseIds,
        classIds: draft.classIds,
        title: draft.title,
        location: draft.location,
        startsOn: draft.startsOn,
        endsOn: draft.endsOn || null,
        startTime: normalizeTimeInput(draft.startTime),
        endTime: normalizeTimeInput(draft.endTime),
      };
      const id = isNew
        ? await createEvent(write, user.id)
        : await updateEvent(eventId, write).then(() => eventId);
      if (lexicalJson) {
        const state = JSON.parse(lexicalJson) as SerializedEditorState;
        await saveEventBlocks(id, editorStateToBlocks(state));
      }
      const allowedMaterialIds = new Set(
        (materialsQuery.data ?? []).map((material) => material.id),
      );
      const materialIds = materialsQuery.isSuccess
        ? draft.materialIds.filter((materialId) => allowedMaterialIds.has(materialId))
        : draft.materialIds;
      await saveEventMaterials(id, materialIds);
      return id;
    },
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await queryClient.invalidateQueries({ queryKey: ["calendar"] });
      await queryClient.invalidateQueries({ queryKey: parentQueryKeys.dashboard(organization.id, user.id) });
      toast.success(isNew ? "Event added" : "Event saved");
      navigate(eventPath(organization.slug, id));
    },
    onError: (error: Error) => {
      toastCaughtError(error);
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const message = validateEventDraft(draft);
    if (message) {
      toast.error(message);
      return;
    }
    save.mutate();
  }

  return {
    organization,
    isNew,
    loading: !isNew && eventQuery.isLoading,
    notFound: !isNew && eventQuery.isSuccess && !loaded,
    canEdit,
    title: draft.title,
    draft,
    blocks: loaded?.blocks ?? [],
    courses: courseOptions,
    classes: classOptions,
    materials: materialsQuery.data ?? [],
    pending: save.isPending,
    editorKey: isNew ? "event-new" : `event-${eventId}`,
    setAudience: (audience: EventAudience) =>
      setDraft((current) => ({
        ...current,
        audience,
        courseIds: audience === "course" ? current.courseIds.slice(0, 1) : [],
        classIds: audience === "class" ? current.classIds : [],
      })),
    selectCourse: (id: number) =>
      setDraft((current) => ({ ...current, courseIds: [id] })),
    toggleClass: (id: number) =>
      setDraft((current) => ({
        ...current,
        classIds: toggleDraftId(current.classIds, id),
      })),
    setTitle: (title: string) => setDraft((current) => ({ ...current, title })),
    setLocation: (location: string) => setDraft((current) => ({ ...current, location })),
    setStartsOn: (startsOn: string) => setDraft((current) => ({ ...current, startsOn })),
    setEndsOn: (endsOn: string) => setDraft((current) => ({ ...current, endsOn })),
    setStartTime: (startTime: string) => setDraft((current) => ({ ...current, startTime })),
    setEndTime: (endTime: string) => setDraft((current) => ({ ...current, endTime })),
    toggleMaterial: (id: number) =>
      setDraft((current) => ({
        ...current,
        materialIds: toggleDraftId(current.materialIds, id),
      })),
    onDraftChange: (json: string) => {
      if (initialLexical.current === null) initialLexical.current = json;
      setLexicalJson(json);
    },
    hasChanges:
      JSON.stringify(draft) !== baseline ||
      (lexicalJson !== null && lexicalJson !== initialLexical.current),
    canSave: validateEventDraft(draft) === null,
    saving: save.isPending,
    cancelTo: isNew
      ? `/my/${organization.slug}/calendar`
      : eventPath(organization.slug, eventId),
    onSubmit,
  };
}
