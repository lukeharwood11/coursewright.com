import type { CourseQuizPrintView } from "@/quizzes/model/print";
import type { PrintMaterial } from "./packet";
import type { QuizKeyPrintMode } from "./quizKeyPrintMode";

type CourseQuizPrintRow = Omit<
  PrintMaterial,
  "courseQuizQuestions" | "courseQuizShowsKey" | "courseQuizKeyMode"
>;

export function pushCourseQuizPrintMaterials(
  target: PrintMaterial[],
  row: CourseQuizPrintRow,
  worksheetQuestions: CourseQuizPrintView[],
  keyQuestions: CourseQuizPrintView[],
  mode: QuizKeyPrintMode,
): void {
  if (mode === "both") {
    target.push({
      ...row,
      courseQuizQuestions: worksheetQuestions,
      courseQuizShowsKey: false,
      courseQuizKeyMode: "worksheet",
    });
    target.push({
      ...row,
      title: `${row.title} — Answers`,
      courseQuizQuestions: keyQuestions,
      courseQuizShowsKey: true,
      courseQuizKeyMode: "key",
      pageBreakBefore: true,
    });
    return;
  }
  const showKey = mode === "key";
  target.push({
    ...row,
    courseQuizQuestions: showKey ? keyQuestions : worksheetQuestions,
    courseQuizShowsKey: showKey,
    courseQuizKeyMode: mode,
  });
}
