import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadDashboardForStaffViewMode } from "@/parent/databridge/dashboard";
import { useQuery } from "@tanstack/react-query";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { browsesAsStaff } from "@/organizations/model/role";
import {
  applyPrintSelection,
  buildThisWeekPrintCatalog,
  catalogItemCanShowQuizKey,
  catalogItemsForStudent,
  type ThisWeekPrintCatalog,
  type ThisWeekPrintCatalogItem,
  type ThisWeekPrintSelectionContext,
  type ThisWeekPrintSelectionOptions,
} from "@/print/model/thisWeekPrintCatalog";
import {
  defaultQuizKeyPrintMode,
  quizKeyModeForQuiz,
  type QuizKeyPrintMode,
} from "@/print/model/quizKeyPrintMode";
import {
  buildThisWeekPrintSearch,
  parseThisWeekPrintSearch,
} from "@/print/model/paths";

export type ThisWeekPrintStudentGroups = {
  studentId: number;
  studentName: string;
  lessonPlans: Array<{
    planId: number;
    title: string;
    notes: ThisWeekPrintCatalogItem | null;
    materials: ThisWeekPrintCatalogItem[];
  }>;
  importantNow: ThisWeekPrintCatalogItem[];
  assigned: ThisWeekPrintCatalogItem[];
  due: ThisWeekPrintCatalogItem[];
};

function cloneSelection(
  selection: ThisWeekPrintSelectionOptions,
): ThisWeekPrintSelectionOptions {
  return {
    omittedKeys: new Set(selection.omittedKeys),
    breakKeys: new Set(selection.breakKeys),
    pack: selection.pack,
    studentBreaks: selection.studentBreaks,
    quizKeyModes: new Map(selection.quizKeyModes),
  };
}

function groupsForCatalog(catalog: ThisWeekPrintCatalog): ThisWeekPrintStudentGroups[] {
  return catalog.students.map((student) => {
    const items = catalogItemsForStudent(catalog, student.id);
    const used = new Set<string>();
    const lessonPlans: ThisWeekPrintStudentGroups["lessonPlans"] = [];

    for (const item of items) {
      if (!item.categories.includes("lesson_plan_notes")) continue;
      const materials = items.filter(
        (row) =>
          row.lessonPlanId === item.id &&
          row.categories.includes("lesson_plan_material"),
      );
      materials.forEach((row) => used.add(row.printKey));
      used.add(item.printKey);
      lessonPlans.push({
        planId: item.id,
        title: item.title,
        notes: item,
        materials,
      });
    }

    const importantNow = items.filter(
      (item) => !used.has(item.printKey) && item.categories.includes("important_now"),
    );
    importantNow.forEach((item) => used.add(item.printKey));

    const assigned = items.filter(
      (item) => !used.has(item.printKey) && item.categories.includes("assigned"),
    );
    assigned.forEach((item) => used.add(item.printKey));

    const due = items.filter(
      (item) => !used.has(item.printKey) && item.categories.includes("due"),
    );

    return {
      studentId: student.id,
      studentName: student.name,
      lessonPlans,
      importantNow,
      assigned,
      due,
    };
  });
}

export function useThisWeekPrintOptions(organizationId: number, userId: string) {
  const location = useLocation();
  const navigate = useNavigate();
  const { staffViewMode, parentPresentation, role } = useOrgShell();
  const selectionContext: ThisWeekPrintSelectionContext = useMemo(
    () => ({
      teacherView: !parentPresentation,
      viewerIsStudent: role === "student" || staffViewMode === "student",
    }),
    [parentPresentation, role, staffViewMode],
  );
  const staff = role ? browsesAsStaff(role) : false;
  const url = useMemo(
    () => parseThisWeekPrintSearch(location.search),
    [location.search],
  );

  const mode =
    staff && parentPresentation && staffViewMode !== "teacher"
      ? staffViewMode
      : ("family" as const);

  const dashboardQuery = useQuery({
    queryKey: ["print-week-dashboard", organizationId, userId, mode, url.weekStart],
    queryFn: () => {
      const options = { weekStart: url.weekStart };
      return mode === "family"
        ? loadDashboardForStaffViewMode(organizationId, userId, "teacher", "Preview", options)
        : loadDashboardForStaffViewMode(organizationId, userId, mode, "Preview", options);
    },
    retry: false,
  });

  const catalog = useMemo(() => {
    if (!dashboardQuery.data) return null;
    return buildThisWeekPrintCatalog(dashboardQuery.data, url.studentIds);
  }, [dashboardQuery.data, url.studentIds]);

  const refs = useMemo(() => {
    if (!catalog) return [];
    return applyPrintSelection(catalog, url.selection, selectionContext);
  }, [catalog, url.selection, selectionContext]);

  const studentGroups = useMemo(
    () => (catalog ? groupsForCatalog(catalog) : []),
    [catalog],
  );

  const replaceSelection = useCallback(
    (selection: ThisWeekPrintSelectionOptions) => {
      const search = buildThisWeekPrintSearch({
        studentIds: url.studentIds,
        weekStart: url.weekStart,
        selection,
      });
      navigate({ pathname: location.pathname, search }, { replace: true });
    },
    [location.pathname, navigate, url.studentIds, url.weekStart],
  );

  const isIncluded = useCallback(
    (printKey: string) => !url.selection.omittedKeys.has(printKey),
    [url.selection.omittedKeys],
  );

  const setIncluded = useCallback(
    (printKey: string, included: boolean) => {
      const next = cloneSelection(url.selection);
      if (included) next.omittedKeys.delete(printKey);
      else next.omittedKeys.add(printKey);
      replaceSelection(next);
    },
    [replaceSelection, url.selection],
  );

  const setKeysIncluded = useCallback(
    (keys: string[], included: boolean) => {
      const next = cloneSelection(url.selection);
      for (const key of keys) {
        if (included) next.omittedKeys.delete(key);
        else next.omittedKeys.add(key);
      }
      replaceSelection(next);
    },
    [replaceSelection, url.selection],
  );

  const hasPageBreak = useCallback(
    (printKey: string) => url.selection.breakKeys.has(printKey),
    [url.selection.breakKeys],
  );

  const setPageBreak = useCallback(
    (printKey: string, enabled: boolean) => {
      const next = cloneSelection(url.selection);
      if (enabled) next.breakKeys.add(printKey);
      else next.breakKeys.delete(printKey);
      replaceSelection(next);
    },
    [replaceSelection, url.selection],
  );

  const setPack = useCallback(
    (pack: boolean) => {
      replaceSelection({ ...cloneSelection(url.selection), pack });
    },
    [replaceSelection, url.selection],
  );

  const setStudentBreaks = useCallback(
    (studentBreaks: boolean) => {
      replaceSelection({ ...cloneSelection(url.selection), studentBreaks });
    },
    [replaceSelection, url.selection],
  );

  const quizKeyModeForItem = useCallback(
    (item: ThisWeekPrintCatalogItem): QuizKeyPrintMode => {
      const canShowKey = catalogItemCanShowQuizKey(item, selectionContext);
      return quizKeyModeForQuiz(item.id, url.selection.quizKeyModes, canShowKey);
    },
    [selectionContext, url.selection.quizKeyModes],
  );

  const setQuizKeyMode = useCallback(
    (quizId: number, mode: QuizKeyPrintMode) => {
      const next = cloneSelection(url.selection);
      if (mode === defaultQuizKeyPrintMode(true)) {
        next.quizKeyModes.delete(quizId);
      } else {
        next.quizKeyModes.set(quizId, mode);
      }
      replaceSelection(next);
    },
    [replaceSelection, url.selection],
  );

  const itemCanShowQuizKey = useCallback(
    (item: ThisWeekPrintCatalogItem) =>
      catalogItemCanShowQuizKey(item, selectionContext),
    [selectionContext],
  );

  return {
    loading: dashboardQuery.isPending,
    error: dashboardQuery.error ? dashboardQuery.error.message : null,
    catalog,
    studentGroups,
    selection: url.selection,
    studentIds: url.studentIds,
    refs,
    selectionEmpty: Boolean(catalog && catalog.items.length > 0 && refs.length === 0),
    isIncluded,
    setIncluded,
    setKeysIncluded,
    hasPageBreak,
    setPageBreak,
    setPack,
    setStudentBreaks,
    selectionContext,
    quizKeyModeForItem,
    setQuizKeyMode,
    itemCanShowQuizKey,
  };
}
