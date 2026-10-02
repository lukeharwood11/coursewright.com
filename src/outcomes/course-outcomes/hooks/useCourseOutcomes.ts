import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import {
  claimedInstructorUserIds,
  staffCanManageCourse,
  staffCanViewCourse,
} from "@/courses/model/access";
import {
  courseQueryKeys,
  getCourse,
  listCourseInstructors,
} from "@/courses/databridge/courses";
import {
  deleteCriterion,
  insertCourseOutcome,
  insertCriterion,
  listCourseOutcomes,
  outcomeQueryKeys,
  updateCourseOutcome,
  updateCriterion,
} from "@/outcomes/databridge/outcomes";
import {
  activeOutcomes,
  archivedOutcomes,
  nextSortOrder,
  normalizeOutcomeText,
  sortOrdersForIds,
  validateOutcomeStatement,
  type CourseOutcome,
} from "@/outcomes/model/outcomes";

export function useCourseOutcomes() {
  const { courseId: courseIdParam } = useParams();
  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const enabled = Number.isFinite(courseId);

  const courseQuery = useQuery({
    queryKey: courseQueryKeys.detail(courseId),
    queryFn: () => getCourse(courseId),
    enabled,
  });
  const instructorsQuery = useQuery({
    queryKey: courseQueryKeys.instructors(courseId),
    queryFn: () => listCourseInstructors(courseId),
    enabled,
  });
  const outcomesQuery = useQuery({
    queryKey: outcomeQueryKeys.course(courseId),
    queryFn: () => listCourseOutcomes(courseId),
    enabled,
  });

  const course = courseQuery.data ?? null;
  const sameOrg = course?.organizationId === organization.id;
  const instructorUserIds = claimedInstructorUserIds(instructorsQuery.data ?? []);
  const access = {
    role,
    parentPresentation,
    userId: user.id,
    instructorUserIds,
  };
  const accessReady = !courseQuery.isLoading && !instructorsQuery.isLoading;
  const canView = Boolean(accessReady && sameOrg && staffCanViewCourse(access));
  const canEdit = Boolean(accessReady && sameOrg && staffCanManageCourse(access));
  const outcomes = sameOrg ? (outcomesQuery.data ?? []) : [];

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: outcomeQueryKeys.course(courseId) });
  }

  function checkedStatement(statement: string): string | null {
    const error = validateOutcomeStatement(statement);
    if (error) {
      setFormError(error);
      return null;
    }
    setFormError(null);
    return normalizeOutcomeText(statement);
  }

  const addOutcome = useMutation({
    mutationFn: async (statement: string) => {
      if (!course) throw new Error("Course isn’t loaded.");
      await insertCourseOutcome({
        organizationId: course.organizationId,
        courseId,
        statement,
        sortOrder: nextSortOrder(outcomes),
      });
    },
    onSuccess: invalidate,
  });

  const saveStatement = useMutation({
    mutationFn: (input: { id: number; statement: string }) =>
      updateCourseOutcome({ id: input.id, statement: input.statement }),
    onSuccess: invalidate,
  });

  const setArchived = useMutation({
    mutationFn: (input: { id: number; archived: boolean }) =>
      updateCourseOutcome({
        id: input.id,
        archivedAt: input.archived ? new Date().toISOString() : null,
      }),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(
        sortOrdersForIds(ids).map((row) =>
          updateCourseOutcome({ id: row.id, sortOrder: row.sortOrder }),
        ),
      );
    },
    onSuccess: invalidate,
  });

  const addCriterion = useMutation({
    mutationFn: async (input: { outcome: CourseOutcome; statement: string }) => {
      await insertCriterion({
        outcomeId: input.outcome.id,
        statement: input.statement,
        sortOrder: nextSortOrder(input.outcome.criteria),
      });
    },
    onSuccess: invalidate,
  });

  const saveCriterion = useMutation({
    mutationFn: (input: { id: number; statement: string }) =>
      updateCriterion({ id: input.id, statement: input.statement }),
    onSuccess: invalidate,
  });

  const removeCriterion = useMutation({
    mutationFn: (id: number) => deleteCriterion(id),
    onSuccess: invalidate,
  });

  const reorderCriteria = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(
        sortOrdersForIds(ids).map((row) =>
          updateCriterion({ id: row.id, sortOrder: row.sortOrder }),
        ),
      );
    },
    onSuccess: invalidate,
  });

  function moveOutcome(outcome: CourseOutcome, direction: -1 | 1) {
    const current = activeOutcomes(outcomes);
    const index = current.findIndex((row) => row.id === outcome.id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= current.length) return;
    const ids = current.map((row) => row.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(next, 0, moved);
    reorder.mutate(ids);
  }

  const error =
    [courseQuery.error, instructorsQuery.error, outcomesQuery.error, addOutcome.error, saveStatement.error, setArchived.error, reorder.error, addCriterion.error, saveCriterion.error, removeCriterion.error, reorderCriteria.error]
      .find((item) => item instanceof Error)?.message ?? null;

  return {
    organization,
    course: sameOrg ? course : null,
    loading:
      !enabled ||
      courseQuery.isLoading ||
      instructorsQuery.isLoading ||
      (canView && outcomesQuery.isLoading),
    notFound: enabled && accessReady && (!course || !sameOrg || !canView),
    canEdit,
    active: activeOutcomes(outcomes),
    archived: archivedOutcomes(outcomes),
    formError,
    error,
    saving:
      addOutcome.isPending ||
      saveStatement.isPending ||
      addCriterion.isPending ||
      reorder.isPending,
    addOutcome: (statement: string, onSaved?: () => void) => {
      const text = checkedStatement(statement);
      if (!text) return;
      addOutcome.mutate(text, { onSuccess: () => onSaved?.() });
    },
    saveStatement: (id: number, statement: string) => {
      const text = checkedStatement(statement);
      if (!text) return;
      const current = outcomes.find((outcome) => outcome.id === id);
      if (current && text === current.statement) return;
      saveStatement.mutate({ id, statement: text });
    },
    archive: (id: number) => setArchived.mutate({ id, archived: true }),
    restore: (id: number) => setArchived.mutate({ id, archived: false }),
    moveUp: (outcome: CourseOutcome) => moveOutcome(outcome, -1),
    moveDown: (outcome: CourseOutcome) => moveOutcome(outcome, 1),
    addCriterion: (outcome: CourseOutcome, statement: string, onSaved?: () => void) => {
      const text = checkedStatement(statement);
      if (!text) return;
      addCriterion.mutate({ outcome, statement: text }, { onSuccess: () => onSaved?.() });
    },
    saveCriterion: (id: number, statement: string) => {
      const text = checkedStatement(statement);
      if (!text) return;
      const current = outcomes
        .flatMap((outcome) => outcome.criteria)
        .find((criterion) => criterion.id === id);
      if (current && text === current.statement) return;
      saveCriterion.mutate({ id, statement: text });
    },
    removeCriterion: (id: number) => removeCriterion.mutate(id),
    moveCriterion: (outcome: CourseOutcome, criterionId: number, direction: -1 | 1) => {
      const ids = outcome.criteria.map((row) => row.id);
      const index = ids.indexOf(criterionId);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= ids.length) return;
      const [moved] = ids.splice(index, 1);
      ids.splice(next, 0, moved);
      reorderCriteria.mutate(ids);
    },
  };
}
