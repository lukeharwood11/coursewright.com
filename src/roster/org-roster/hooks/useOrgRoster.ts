import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  courseQueryKeys,
  listCourses,
} from "@/courses/databridge/courses";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import { getOrganization } from "@/organizations/databridge/organizations";
import {
  addClassMembers,
  classQueryKeys,
  createClass,
  listClasses,
} from "@/roster/databridge/classes";
import {
  enrollStudents,
  enrollmentQueryKeys,
} from "@/roster/databridge/enrollments";
import {
  createStudents,
  listStudents,
  studentQueryKeys,
} from "@/roster/databridge/students";
import { validateClass } from "@/roster/model/classGroup";
import {
  emptyStudentDraft,
  mergeSelectedIds,
  parseStudentNamesPaste,
  studentMatchesQuery,
  toggleIdInSet,
  validateStudentBatch,
  type NewStudentDraft,
} from "@/roster/model/studentProfile";

export function useOrgRoster() {
  const { organization } = useOrgShell();
  const queryClient = useQueryClient();

  const studentsQuery = useQuery({
    queryKey: studentQueryKeys.list(organization.id),
    queryFn: () => listStudents(organization.id),
  });

  const classesQuery = useQuery({
    queryKey: classQueryKeys.list(organization.id),
    queryFn: () => listClasses(organization.id),
  });

  const coursesQuery = useQuery({
    queryKey: courseQueryKeys.list(organization.id),
    queryFn: () => listCourses(organization.id),
  });

  const organizationQuery = useQuery({
    queryKey: orgQueryKeys.detail(organization.id),
    queryFn: () => getOrganization(organization.id),
  });

  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [assignClassId, setAssignClassId] = useState("");
  const [assignCourseId, setAssignCourseId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [drafts, setDrafts] = useState<NewStudentDraft[]>([emptyStudentDraft()]);
  const [pasteText, setPasteText] = useState("");
  const [studentError, setStudentError] = useState<string | null>(null);
  const [classTitle, setClassTitle] = useState("");
  const [classError, setClassError] = useState<string | null>(null);
  const [creatingClassOpen, setCreatingClassOpen] = useState(false);

  const students = (studentsQuery.data ?? []).filter((student) =>
    studentMatchesQuery(student, query),
  );

  const addStudentsMutation = useMutation({
    mutationFn: async () => {
      const parsed = validateStudentBatch(
        drafts,
        organizationQuery.data?.gradeLabels ?? [],
      );
      if (!parsed.ok) throw new Error(parsed.error);
      return createStudents(organization.id, parsed.values);
    },
    onSuccess: async (created) => {
      setDrafts([emptyStudentDraft()]);
      setPasteText("");
      setStudentError(null);
      setPanelOpen(false);
      await queryClient.invalidateQueries({
        queryKey: studentQueryKeys.list(organization.id),
      });
      toast(
        created.length === 1
          ? "Student added."
          : `${created.length} students added.`,
      );
    },
    onError: (error: Error) => {
      setStudentError(error.message);
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async () => {
      const parsed = validateClass({ title: classTitle });
      if (!parsed.ok) throw new Error(parsed.error);
      return createClass(organization.id, parsed.value);
    },
    onSuccess: async () => {
      setClassTitle("");
      setClassError(null);
      setCreatingClassOpen(false);
      await queryClient.invalidateQueries({
        queryKey: classQueryKeys.list(organization.id),
      });
      toast("Class created.");
    },
    onError: (error: Error) => {
      setClassError(error.message);
    },
  });

  const addToClassMutation = useMutation({
    mutationFn: async () => {
      const classId = Number(assignClassId);
      if (!Number.isFinite(classId) || classId <= 0) {
        throw new Error("Choose a class.");
      }
      if (selectedIds.length === 0) {
        throw new Error("Select at least one student.");
      }
      await addClassMembers(classId, selectedIds);
      return { count: selectedIds.length, classId };
    },
    onSuccess: async ({ count, classId }) => {
      setAssignError(null);
      setSelectedIds([]);
      setAssignClassId("");
      await queryClient.invalidateQueries({
        queryKey: classQueryKeys.members(classId),
      });
      await queryClient.invalidateQueries({
        queryKey: classQueryKeys.list(organization.id),
      });
      toast(count === 1 ? "Student added to class." : `${count} students added to class.`);
    },
    onError: (error: Error) => {
      setAssignError(error.message);
    },
  });

  const enrollInCourseMutation = useMutation({
    mutationFn: async () => {
      const courseId = Number(assignCourseId);
      if (!Number.isFinite(courseId) || courseId <= 0) {
        throw new Error("Choose a course.");
      }
      if (selectedIds.length === 0) {
        throw new Error("Select at least one student.");
      }
      await enrollStudents(courseId, selectedIds);
      return { count: selectedIds.length, courseId };
    },
    onSuccess: async ({ count, courseId }) => {
      setAssignError(null);
      setSelectedIds([]);
      setAssignCourseId("");
      await queryClient.invalidateQueries({
        queryKey: enrollmentQueryKeys.course(courseId),
      });
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.list(organization.id),
      });
      await queryClient.invalidateQueries({
        queryKey: courseQueryKeys.listWithCatalog(organization.id),
      });
      toast(count === 1 ? "Student enrolled." : `${count} students enrolled.`);
    },
    onError: (error: Error) => {
      setAssignError(error.message);
    },
  });

  function onAddStudents(event: FormEvent) {
    event.preventDefault();
    setStudentError(null);
    addStudentsMutation.mutate();
  }

  function onCreateClass(event: FormEvent) {
    event.preventDefault();
    setClassError(null);
    createClassMutation.mutate();
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
    setStudentError(null);
  }

  const assigning =
    addToClassMutation.isPending || enrollInCourseMutation.isPending;

  return {
    organization,
    gradeLabels: organizationQuery.data?.gradeLabels ?? [],
    students,
    classes: classesQuery.data ?? [],
    courses: coursesQuery.data ?? [],
    query,
    selectedIds,
    assignClassId,
    assignCourseId,
    assignError,
    panelOpen,
    drafts,
    pasteText,
    studentError,
    classTitle,
    classError,
    creatingClassOpen,
    loading:
      studentsQuery.isLoading ||
      classesQuery.isLoading ||
      coursesQuery.isLoading,
    error: studentsQuery.error
      ? studentsQuery.error.message
      : classesQuery.error
        ? classesQuery.error.message
        : coursesQuery.error
          ? coursesQuery.error.message
          : null,
    addingStudents: addStudentsMutation.isPending,
    creatingClass: createClassMutation.isPending,
    assigning,
    setQuery: (value: string) => {
      setQuery(value);
    },
    onToggle: (id: number) => {
      setSelectedIds((current) => toggleIdInSet(current, id));
      setAssignError(null);
    },
    onSelectAllMatching: () => {
      setSelectedIds((current) =>
        mergeSelectedIds(
          current,
          students.map((student) => student.id),
        ),
      );
      setAssignError(null);
    },
    onClearSelection: () => {
      setSelectedIds([]);
      setAssignClassId("");
      setAssignCourseId("");
      setAssignError(null);
    },
    setAssignClassId: (value: string) => {
      setAssignClassId(value);
      setAssignError(null);
    },
    setAssignCourseId: (value: string) => {
      setAssignCourseId(value);
      setAssignError(null);
    },
    onAddToClass: () => {
      setAssignError(null);
      addToClassMutation.mutate();
    },
    onEnrollInCourse: () => {
      setAssignError(null);
      enrollInCourseMutation.mutate();
    },
    openPanel: () => setPanelOpen(true),
    closePanel: () => {
      setPanelOpen(false);
      setStudentError(null);
    },
    setDraft: (index: number, draft: NewStudentDraft) => {
      setDrafts((current) =>
        current.map((row, rowIndex) => (rowIndex === index ? draft : row)),
      );
      setStudentError(null);
    },
    onAddRow: () => {
      setDrafts((current) => [...current, emptyStudentDraft()]);
      setStudentError(null);
    },
    onRemoveRow: (index: number) => {
      setDrafts((current) =>
        current.length <= 1
          ? [emptyStudentDraft()]
          : current.filter((_, rowIndex) => rowIndex !== index),
      );
      setStudentError(null);
    },
    setPasteText: (value: string) => {
      setPasteText(value);
      setStudentError(null);
    },
    onApplyPaste,
    onAddStudents,
    setClassTitle: (value: string) => {
      setClassTitle(value);
      setClassError(null);
    },
    openCreateClass: () => setCreatingClassOpen(true),
    closeCreateClass: () => {
      setCreatingClassOpen(false);
      setClassError(null);
    },
    onCreateClass,
  };
}
