import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { SerializedEditorState } from "lexical";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import { canManageOrgSettings, isStaffRole } from "@/organizations/model/role";
import { courseQueryKeys, listCourses } from "@/courses/databridge/courses";
import { classQueryKeys, listClasses } from "@/roster/databridge/classes";
import {
  createDiscussion,
  discussionQueryKeys,
  listAttachableMaterials,
  listCourseIdsTaughtBy,
  listParentDiscussionContext,
  uploadDiscussionFile,
} from "@/discussions/databridge/discussions";
import { discussionPath, discussionsPath } from "@/discussions/model/paths";
import type { DiscussionAudience } from "@/discussions/model/audience";
import {
  emptyLexicalState,
  serializeDiscussionBody,
} from "@/discussions/model/messageBody";
import {
  draftFromSearchParams,
  emptyDiscussionDraft,
  messageBodyHasContent,
  validateUrlAttachment,
  type AttachmentContent,
  type DiscussionDraft,
} from "@/discussions/model/validate";
import type {
  ComposerMode,
  PendingAttachment,
} from "@/discussions/discussion/components/MessageComposer";

export const DISCUSSION_FORM_ID = "discussion-form";

export function useDiscussionNew() {
  const [searchParams] = useSearchParams();
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canEdit = staffCanEdit(role, parentPresentation);
  const isStaff = role ? isStaffRole(role) : false;
  const canPickAnyCourse = role ? canManageOrgSettings(role) : false;
  const prefill = useMemo(
    () => draftFromSearchParams(searchParams),
    [searchParams],
  );

  const [draft, setDraft] = useState<DiscussionDraft>(() => ({
    ...emptyDiscussionDraft(),
    ...prefill,
  }));
  const [mode, setMode] = useState<ComposerMode>("plain");
  const [lexical, setLexical] = useState<SerializedEditorState>(emptyLexicalState);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const coursesQuery = useQuery({
    queryKey: courseQueryKeys.list(organization.id),
    queryFn: () => listCourses(organization.id),
  });
  const taughtQuery = useQuery({
    queryKey: ["courses", "taught", user.id],
    queryFn: () => listCourseIdsTaughtBy(user.id),
    enabled: canEdit && !canPickAnyCourse,
  });
  const classesQuery = useQuery({
    queryKey: classQueryKeys.list(organization.id),
    queryFn: () => listClasses(organization.id),
  });
  const parentContextQuery = useQuery({
    queryKey: discussionQueryKeys.parentContext(organization.id, user.id),
    queryFn: () => listParentDiscussionContext(organization.id, user.id),
    enabled: parentPresentation,
  });
  const materialsQuery = useQuery({
    queryKey: discussionQueryKeys.materials(organization.id, draft.courseId),
    queryFn: () =>
      listAttachableMaterials({
        organizationId: organization.id,
        courseId: draft.courseId,
      }),
  });

  const parentContext = parentContextQuery.data;
  const taughtIds = taughtQuery.data ?? [];

  const courses = useMemo(() => {
    const all = coursesQuery.data ?? [];
    if (parentPresentation) {
      const allowed = new Set(
        (parentContext?.enrollments ?? []).map((row) => row.courseId),
      );
      return all.filter((course) => allowed.has(course.id));
    }
    if (canPickAnyCourse) return all;
    const taught = new Set(taughtIds);
    return all.filter((course) => taught.has(course.id));
  }, [
    coursesQuery.data,
    parentPresentation,
    parentContext,
    canPickAnyCourse,
    taughtIds,
  ]);

  const classes = useMemo(() => {
    const all = classesQuery.data ?? [];
    if (parentPresentation) {
      const allowed = new Set(
        (parentContext?.classMembers ?? []).map((row) => row.classId),
      );
      return all.filter((classGroup) => allowed.has(classGroup.id));
    }
    return all;
  }, [classesQuery.data, parentPresentation, parentContext]);

  const redirectHome =
    isStaff && parentPresentation && (parentContext?.students.length ?? 0) === 0;

  useEffect(() => {
    if (!parentPresentation || parentContextQuery.isLoading) return;
    if (redirectHome) {
      navigate(`/my/${organization.slug}`, { replace: true });
    }
  }, [
    parentPresentation,
    parentContextQuery.isLoading,
    redirectHome,
    navigate,
    organization.slug,
  ]);

  const attachmentContent: AttachmentContent[] = attachments.map((attachment) =>
    attachment.kind === "file"
      ? { kind: "file", label: attachment.label }
      : attachment.kind === "material"
        ? {
            kind: "material",
            materialId: attachment.materialId,
            label: attachment.label,
          }
        : {
            kind: "url",
            url: attachment.url,
            label: attachment.label,
          },
  );

  const openingBody =
    mode === "plain"
      ? ({ v: 1 as const, format: "plain" as const, text: draft.body })
      : ({ v: 1 as const, format: "lexical" as const, lexical });

  const draftForSave: DiscussionDraft = {
    ...draft,
    body: serializeDiscussionBody(openingBody),
  };

  const initial: DiscussionDraft = { ...emptyDiscussionDraft(), ...prefill };
  const hasChanges =
    draft.audience !== initial.audience ||
    draft.courseId !== initial.courseId ||
    draft.classId !== initial.classId ||
    draft.title !== initial.title ||
    draft.body !== initial.body ||
    mode === "lexical" ||
    attachments.length > 0;

  const canSave =
    Boolean(draft.audience) &&
    (draft.audience !== "course" || draft.courseId != null) &&
    (draft.audience !== "class" || draft.classId != null) &&
    Boolean(draft.title.trim()) &&
    messageBodyHasContent(openingBody, attachmentContent) &&
    attachmentContent.every(
      (attachment) =>
        attachment.kind !== "url" || validateUrlAttachment(attachment.url) == null,
    );

  function setAudience(audience: DiscussionAudience) {
    setDraft((current) => ({
      ...current,
      audience,
      courseId: audience === "course" ? current.courseId : null,
      classId: audience === "class" ? current.classId : null,
    }));
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!draft.audience) {
        const message = "Choose a course or a class.";
        setFormError(message);
        throw new Error(message);
      }
      if (draft.audience === "course" && draft.courseId == null) {
        const message = "Choose a course.";
        setFormError(message);
        throw new Error(message);
      }
      if (draft.audience === "class" && draft.classId == null) {
        const message = "Choose a class.";
        setFormError(message);
        throw new Error(message);
      }
      if (!draft.title.trim()) {
        const message = "Add a title so people know what this is about.";
        setFormError(message);
        throw new Error(message);
      }
      if (!messageBodyHasContent(openingBody, attachmentContent)) {
        const message = "Write a first post, or add a file, material, or link.";
        setFormError(message);
        throw new Error(message);
      }
      for (const attachment of attachmentContent) {
        if (attachment.kind === "url") {
          const urlMessage = validateUrlAttachment(attachment.url);
          if (urlMessage) {
            setFormError(urlMessage);
            throw new Error(urlMessage);
          }
        }
      }
      setFormError(null);
      const uploaded = await Promise.all(
        attachments.map(async (attachment) => {
          if (attachment.kind === "file") {
            const file = await uploadDiscussionFile({
              organizationId: organization.id,
              uploadedBy: user.id,
              file: attachment.file,
            });
            return {
              kind: "file" as const,
              fileId: file.id,
              label: attachment.label,
            };
          }
          if (attachment.kind === "material") {
            return {
              kind: "material" as const,
              materialId: attachment.materialId,
              label: attachment.label,
            };
          }
          return {
            kind: "url" as const,
            url: attachment.url,
            label: attachment.label,
          };
        }),
      );
      return createDiscussion({
        organizationId: organization.id,
        createdBy: user.id,
        draft: draftForSave,
        attachments: uploaded,
      });
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({
        queryKey: discussionQueryKeys.org(organization.id, user.id),
      });
      navigate(discussionPath(organization.slug, created.id));
    },
  });

  return {
    organization,
    title: draft.title,
    body: draft.body,
    mode,
    setMode,
    lexical,
    setLexical,
    audience: draft.audience,
    courseId: draft.courseId,
    classId: draft.classId,
    setTitle: (title: string) => setDraft((current) => ({ ...current, title })),
    setBody: (body: string) => setDraft((current) => ({ ...current, body })),
    setAudience,
    setCourseId: (courseId: number | null) =>
      setDraft((current) => ({ ...current, courseId })),
    setClassId: (classId: number | null) =>
      setDraft((current) => ({ ...current, classId })),
    attachments,
    setAttachments,
    courses,
    classes,
    courseEmptyHint: parentPresentation
      ? "You can start a discussion for a course your child is enrolled in."
      : "You can start a discussion for a course you teach.",
    classEmptyHint: parentPresentation
      ? "You can start a discussion for a class your child is in."
      : "Choose a class.",
    materials: materialsQuery.data ?? [],
    hasChanges,
    canSave,
    formError: formError ?? save.error?.message ?? null,
    saving: save.isPending,
    loading:
      coursesQuery.isLoading ||
      classesQuery.isLoading ||
      (parentPresentation && parentContextQuery.isLoading) ||
      (canEdit && !canPickAnyCourse && taughtQuery.isLoading),
    redirectHome,
    onSubmit: (event: FormEvent) => {
      event.preventDefault();
      save.mutate();
    },
    start: () => save.mutate(),
    cancelTo: discussionsPath(organization.slug),
  };
}
