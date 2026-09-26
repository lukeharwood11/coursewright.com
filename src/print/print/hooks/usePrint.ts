import { useDeferredValue, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  printBackPath,
  parseThisWeekPrintSearch,
  parseUnitPrintSearch,
  parseQuizPrintKeySearch,
  type PrintGrainKind,
} from "@/print/model/paths";
import { parseResourcePrintItemIds } from "@/resources/model/paths";
import {
  loadEventPrintPacket,
  loadMaterialPrintPacket,
  loadQuizPrintPacket,
  loadResourcePrintPacket,
  loadUnitPrintPacket,
  loadWeekPrintPacket,
} from "@/print/databridge/packets";
import { accountIsStudentOnCourse, canShowAnswerKey } from "@/quizzes/model/quiz";
import { presentCourseQuizPrint } from "@/quizzes/model/print";
import { pdfBytesToBlob } from "@/print/model/mergePdfs";
import {
  defaultQuizKeyPrintMode,
  type QuizKeyPrintMode,
} from "@/print/model/quizKeyPrintMode";
import { applyPrintSelection } from "@/print/model/thisWeekPrintCatalog";
import { renderPrintPdf } from "./renderPrintPdf";
import { useThisWeekPrintOptions } from "./useThisWeekPrintOptions";

function grainFromPath(
  pathname: string,
  materialId: number,
  unitId: number,
): PrintGrainKind {
  if (pathname.includes("/quizzes/") && pathname.endsWith("/print")) return "quiz";
  if (pathname.includes("/events/") && pathname.endsWith("/print")) return "event";
  if (pathname.includes("/resources/") && pathname.endsWith("/print")) return "resource";
  if (pathname.includes("print-this-week")) return "thisWeek";
  if (Number.isFinite(materialId)) return "material";
  if (Number.isFinite(unitId)) return "unit";
  return "thisWeek";
}

function printSearchForGrain(
  grain: PrintGrainKind,
  deferredSearch: string,
  immediateSearch: string,
): string {
  if (grain === "thisWeek" || grain === "unit" || grain === "quiz") {
    return deferredSearch;
  }
  return immediateSearch;
}

export function usePrint() {
  const params = useParams();
  const location = useLocation();
  const deferredSearch = useDeferredValue(location.search);
  const { organization, parentPresentation, staffViewMode, role } = useOrgShell();
  const user = useAuthedUser();
  const courseId = params.courseId ? Number(params.courseId) : NaN;
  const unitId = params.unitId ? Number(params.unitId) : NaN;
  const materialId = params.materialId ? Number(params.materialId) : NaN;
  const itemId = params.itemId ? Number(params.itemId) : NaN;
  const eventId = params.eventId ? Number(params.eventId) : NaN;
  const quizId = params.quizId ? Number(params.quizId) : NaN;
  const grain = grainFromPath(location.pathname, materialId, unitId);
  const thisWeekOptions = useThisWeekPrintOptions(organization.id, user.id);
  const activeSearch = printSearchForGrain(grain, deferredSearch, location.search);
  const urlOptions = useMemo(
    () => parseThisWeekPrintSearch(activeSearch),
    [activeSearch],
  );
  const unitQuizKeyModes = useMemo(
    () => parseUnitPrintSearch(activeSearch),
    [activeSearch],
  );
  const quizPrintKeyMode = useMemo(
    () => parseQuizPrintKeySearch(activeSearch),
    [activeSearch],
  );
  const selectionContext = useMemo(
    () => ({
      teacherView: !parentPresentation,
      viewerIsStudent:
        role === "student" || staffViewMode === "student",
    }),
    [parentPresentation, role, staffViewMode],
  );
  const deferredRefs = useMemo(() => {
    if (grain !== "thisWeek" || !thisWeekOptions.catalog) return [];
    return applyPrintSelection(
      thisWeekOptions.catalog,
      urlOptions.selection,
      selectionContext,
    );
  }, [grain, thisWeekOptions.catalog, urlOptions.selection, selectionContext]);

  const query = useQuery({
    queryKey: [
      "print",
      organization.id,
      location.pathname,
      activeSearch,
    ],
    enabled: grain !== "thisWeek" || Boolean(thisWeekOptions.catalog),
    queryFn: async () => {
      const loaded =
        grain === "quiz"
          ? null
          : grain === "event"
            ? await loadEventPrintPacket(eventId)
            : grain === "thisWeek"
              ? await loadWeekPrintPacket({
                  organizationId: organization.id,
                  userId: user.id,
                  userEmail: user.email ?? null,
                  parentPresentation,
                  staffViewMode,
                  studentIds: urlOptions.studentIds,
                  weekStart: urlOptions.weekStart,
                  refs: deferredRefs,
                })
              : grain === "resource"
                ? await loadResourcePrintPacket(
                    Number.isFinite(itemId)
                      ? itemId
                      : parseResourcePrintItemIds(location.search),
                  )
                : grain === "material"
                  ? await loadMaterialPrintPacket(materialId)
                  : await loadUnitPrintPacket({
                      unitId,
                      userId: user.id,
                      userEmail: user.email ?? null,
                      parentPresentation,
                      quizKeyModes: unitQuizKeyModes,
                    });
      let packet =
        grain === "quiz"
          ? null
          : loaded
            ? { ...loaded, includeAnswerKey: false }
            : null;
      if (grain === "quiz") {
        const quizPacket = await loadQuizPrintPacket({ quizId, userId: user.id });
        if (!quizPacket) throw new Error("We couldn’t find that to print.");
        const viewerIsStudent = accountIsStudentOnCourse(
          user.email,
          quizPacket.linkedStudents,
        );
        const canShowKey = canShowAnswerKey({
          teacherView: !parentPresentation,
          shareWithParents: quizPacket.shareAnswerKeyWithParents,
          viewerIsStudent,
        });
        const mode: QuizKeyPrintMode =
          quizPrintKeyMode && canShowKey
            ? quizPrintKeyMode
            : defaultQuizKeyPrintMode(canShowKey);
        const worksheet = quizPacket.questions.map((question) =>
          presentCourseQuizPrint(question, false),
        );
        const keyed = quizPacket.questions.map((question) =>
          presentCourseQuizPrint(question, true),
        );
        packet = {
          ...quizPacket.packet,
          includeAnswerKey: false,
          quizKeyMode: mode,
          quizQuestions: mode === "key" ? keyed : worksheet,
          quizQuestionsKey: canShowKey ? keyed : undefined,
        };
      }
      if (!packet) throw new Error("We couldn’t find that to print.");
      const hasQuiz = (packet.quizQuestions?.length ?? 0) > 0;
      if (packet.materials.length === 0 && !hasQuiz) {
        return { packet, blob: null as Blob | null, filename: "print.pdf" };
      }
      const pdf = await renderPrintPdf(packet);
      return {
        packet,
        blob: pdfBytesToBlob(pdf.bytes),
        filename: pdf.filename,
      };
    },
    retry: false,
  });

  const thisWeekLoading =
    grain === "thisWeek" &&
    (thisWeekOptions.loading || !thisWeekOptions.catalog || query.isPending);

  const deferredGrain =
    grain === "thisWeek" || grain === "unit" || grain === "quiz";

  return {
    grain,
    loading: grain === "thisWeek" ? thisWeekLoading : query.isPending,
    updatingPreview:
      deferredGrain &&
      location.search !== deferredSearch &&
      (grain !== "thisWeek" || Boolean(thisWeekOptions.catalog)),
    error: query.error ? query.error.message : thisWeekOptions.error,
    packet: query.data?.packet ?? null,
    blob: query.data?.blob ?? null,
    filename: query.data?.filename ?? "print.pdf",
    empty: Boolean(
      grain === "thisWeek"
        ? thisWeekOptions.selectionEmpty ||
          (query.data &&
            query.data.packet.materials.length === 0 &&
            (query.data.packet.quizQuestions?.length ?? 0) === 0)
        : query.data &&
          query.data.packet.materials.length === 0 &&
          (query.data.packet.quizQuestions?.length ?? 0) === 0,
    ),
    notFound: Boolean(
      query.error && query.error.message.includes("couldn’t find"),
    ),
    backTo: printBackPath({
      grain,
      orgSlug: organization.slug,
      courseId: Number.isFinite(courseId) ? courseId : null,
      unitId: Number.isFinite(unitId) ? unitId : null,
      materialId: Number.isFinite(materialId) ? materialId : null,
      itemId: Number.isFinite(itemId) ? itemId : null,
      eventId: Number.isFinite(eventId) ? eventId : null,
      quizId: Number.isFinite(quizId) ? quizId : null,
    }),
    retry: () => {
      void query.refetch();
    },
    thisWeek: grain === "thisWeek" ? thisWeekOptions : null,
    quizPrintKeyMode,
    unitQuizKeyModes,
    selectionContext,
    quizId: Number.isFinite(quizId) ? quizId : null,
    unitId: Number.isFinite(unitId) ? unitId : null,
  };
}
