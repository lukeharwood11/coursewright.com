import type { Json } from "@/infrastructure/supabase/database.types";
import {
  parseMaterialVisibility,
  type MaterialVisibility,
} from "@/materials/model/visibility";
import type { QuizQuestionKind } from "@/quizzes/model/quiz";
import { requireSupabase } from "./client";

export type QuizRecord = {
  id: number;
  organizationId: number;
  courseId: number;
  unitId: number | null;
  title: string;
  description: string;
  position: number;
  visibility: MaterialVisibility;
  acceptsFrom: string | null;
  acceptsUntil: string | null;
  acceptsTimezone: string | null;
  allowMultipleAttempts: boolean;
  autogradeAndShow: boolean;
  shareAnswerKeyWithParents: boolean;
  deletedAt: string | null;
};

export type QuizChoiceRecord = {
  id: number;
  questionId: number;
  position: number;
  text: string;
  correct: boolean;
};

export type QuizQuestionRecord = {
  id: number;
  quizId: number;
  position: number;
  prompt: string;
  kind: QuizQuestionKind;
  choices: QuizChoiceRecord[];
  answer: string;
};

export type QuizChoiceDraft = {
  id: number | null;
  text: string;
  correct: boolean;
};

export type QuizQuestionDraft = {
  id: number | null;
  prompt: string;
  kind: QuizQuestionKind;
  choices: QuizChoiceDraft[];
  answer: string;
};

export type QuizAttemptRecord = {
  id: number;
  quizId: number;
  studentProfileId: number;
  studentName: string;
  studentEmail: string | null;
  submittedBy: string;
  submitterName: string;
  submitterEmail: string;
  submittedAt: string;
  autograded: boolean;
  score: number | null;
  scoreTotal: number | null;
};

export type QuizAttemptAnswerRecord = {
  attemptId: number;
  questionId: number;
  promptSnapshot: string;
  selectedSummary: string;
  answerText: string;
};

export type LinkedStudent = {
  id: number;
  name: string;
  studentEmail: string | null;
};

export const quizQueryKeys = {
  list: (courseId: number) => ["quizzes", "list", courseId] as const,
  unit: (unitId: number) => ["quizzes", "unit", unitId] as const,
  detail: (id: number) => ["quizzes", "detail", id] as const,
  questions: (id: number) => ["quizzes", "questions", id] as const,
  attempts: (id: number) => ["quizzes", "attempts", id] as const,
};

type QuizRow = {
  id: number;
  organization_id: number;
  course_id: number;
  unit_id: number | null;
  title: string;
  description: string;
  position: number;
  visibility: string;
  accepts_from: string | null;
  accepts_until: string | null;
  accepts_timezone: string | null;
  allow_multiple_attempts: boolean;
  autograde_and_show: boolean;
  share_answer_key_with_parents: boolean;
  deleted_at: string | null;
};

function mapQuiz(row: QuizRow): QuizRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    courseId: row.course_id,
    unitId: row.unit_id,
    title: row.title,
    description: row.description,
    position: row.position,
    visibility: parseMaterialVisibility(row.visibility),
    acceptsFrom: row.accepts_from,
    acceptsUntil: row.accepts_until,
    acceptsTimezone: row.accepts_timezone,
    allowMultipleAttempts: row.allow_multiple_attempts,
    autogradeAndShow: row.autograde_and_show,
    shareAnswerKeyWithParents: row.share_answer_key_with_parents,
    deletedAt: row.deleted_at,
  };
}

const quizColumns =
  "id, organization_id, course_id, unit_id, title, description, position, visibility, accepts_from, accepts_until, accepts_timezone, allow_multiple_attempts, autograde_and_show, share_answer_key_with_parents, deleted_at";

export async function listQuizzesForCourse(courseId: number): Promise<QuizRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("quizzes")
    .select(quizColumns)
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .order("position");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapQuiz(row));
}

export async function listQuizzesForUnit(unitId: number): Promise<QuizRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("quizzes")
    .select(quizColumns)
    .eq("unit_id", unitId)
    .is("deleted_at", null)
    .order("position");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapQuiz(row));
}

export async function getQuiz(quizId: number): Promise<QuizRecord | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("quizzes")
    .select(quizColumns)
    .eq("id", quizId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapQuiz(data) : null;
}

export async function nextQuizPosition(args: {
  courseId: number;
  unitId: number;
}): Promise<number> {
  const db = requireSupabase();
  const [materials, quizzes] = await Promise.all([
    db
      .from("materials")
      .select("position")
      .eq("unit_id", args.unitId)
      .is("deleted_at", null),
    db
      .from("quizzes")
      .select("position")
      .eq("course_id", args.courseId)
      .eq("unit_id", args.unitId)
      .is("deleted_at", null),
  ]);
  if (materials.error) throw new Error(materials.error.message);
  if (quizzes.error) throw new Error(quizzes.error.message);
  const positions = [...(materials.data ?? []), ...(quizzes.data ?? [])].map(
    (row) => row.position,
  );
  if (positions.length === 0) return 0;
  return Math.max(...positions) + 1;
}

export async function createQuiz(args: {
  organizationId: number;
  courseId: number;
  unitId: number;
  title: string;
  description: string;
  createdBy: string;
}): Promise<QuizRecord> {
  const db = requireSupabase();
  const position = await nextQuizPosition({
    courseId: args.courseId,
    unitId: args.unitId,
  });
  const { data, error } = await db
    .from("quizzes")
    .insert({
      organization_id: args.organizationId,
      course_id: args.courseId,
      unit_id: args.unitId,
      title: args.title.trim(),
      description: args.description.trim(),
      position,
      visibility: "unpublished",
      created_by: args.createdBy,
    })
    .select(quizColumns)
    .single();
  if (error) throw new Error(error.message);
  return mapQuiz(data);
}

export async function updateQuiz(
  quizId: number,
  patch: {
    title?: string;
    description?: string;
    visibility?: MaterialVisibility;
    acceptsFrom?: string | null;
    acceptsUntil?: string | null;
    acceptsTimezone?: string | null;
    allowMultipleAttempts?: boolean;
    autogradeAndShow?: boolean;
    shareAnswerKeyWithParents?: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
  },
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("quizzes")
    .update({
      title: patch.title,
      description: patch.description,
      visibility: patch.visibility,
      accepts_from: patch.acceptsFrom,
      accepts_until: patch.acceptsUntil,
      accepts_timezone: patch.acceptsTimezone,
      allow_multiple_attempts: patch.allowMultipleAttempts,
      autograde_and_show: patch.autogradeAndShow,
      share_answer_key_with_parents: patch.shareAnswerKeyWithParents,
      deleted_at: patch.deletedAt,
      deleted_by: patch.deletedBy,
    })
    .eq("id", quizId);
  if (error) throw new Error(error.message);
}

export async function listQuizQuestions(quizId: number): Promise<QuizQuestionRecord[]> {
  const db = requireSupabase();
  const { data: questions, error } = await db
    .from("quiz_questions")
    .select("id, quiz_id, position, prompt, kind")
    .eq("quiz_id", quizId)
    .is("deleted_at", null)
    .order("position");
  if (error) throw new Error(error.message);
  const ids = (questions ?? []).map((row) => row.id);
  let choices: {
    id: number;
    question_id: number;
    position: number;
    text: string;
  }[] = [];
  if (ids.length > 0) {
    const choiceRows = await db
      .from("quiz_choices")
      .select("id, question_id, position, text")
      .in("question_id", ids)
      .is("deleted_at", null)
      .order("position");
    if (choiceRows.error) throw new Error(choiceRows.error.message);
    choices = choiceRows.data ?? [];
  }
  const keys = await db
    .from("quiz_answer_keys")
    .select("question_id, choice_id, answer_text")
    .in("question_id", ids.length > 0 ? ids : [-1]);
  if (keys.error) throw new Error(keys.error.message);
  const correctByQuestion = new Map<number, Set<number>>();
  const answerByQuestion = new Map<number, string>();
  for (const key of keys.data ?? []) {
    if (key.choice_id != null) {
      const set = correctByQuestion.get(key.question_id) ?? new Set<number>();
      set.add(key.choice_id);
      correctByQuestion.set(key.question_id, set);
    } else if (key.answer_text) {
      answerByQuestion.set(key.question_id, key.answer_text);
    }
  }
  return (questions ?? []).map((question) => ({
    id: question.id,
    quizId: question.quiz_id,
    position: question.position,
    prompt: question.prompt,
    kind: question.kind === "short_answer" ? "short_answer" : "multiple_choice",
    choices: choices
      .filter((choice) => choice.question_id === question.id)
      .map((choice) => ({
        id: choice.id,
        questionId: choice.question_id,
        position: choice.position,
        text: choice.text,
        correct: correctByQuestion.get(question.id)?.has(choice.id) ?? false,
      })),
    answer: answerByQuestion.get(question.id) ?? "",
  }));
}

export async function saveQuizQuestions(
  quizId: number,
  drafts: readonly QuizQuestionDraft[],
): Promise<void> {
  const db = requireSupabase();
  const existing = await db
    .from("quiz_questions")
    .select("id")
    .eq("quiz_id", quizId)
    .is("deleted_at", null);
  if (existing.error) throw new Error(existing.error.message);
  const kept = new Set<number>();

  for (const [index, draft] of drafts.entries()) {
    let questionId = draft.id;
    if (questionId) {
      const { error } = await db
        .from("quiz_questions")
        .update({
          position: index,
          prompt: draft.prompt,
          kind: draft.kind,
          deleted_at: null,
        })
        .eq("id", questionId)
        .eq("quiz_id", quizId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await db
        .from("quiz_questions")
        .insert({
          quiz_id: quizId,
          position: index,
          prompt: draft.prompt,
          kind: draft.kind,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      questionId = data.id;
    }
    kept.add(questionId);
    await syncChoices(questionId, draft);
  }

  const remove = (existing.data ?? [])
    .map((row) => row.id)
    .filter((id) => !kept.has(id));
  if (remove.length > 0) {
    const { error } = await db
      .from("quiz_questions")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", remove);
    if (error) throw new Error(error.message);
  }
}

async function syncChoices(questionId: number, draft: QuizQuestionDraft): Promise<void> {
  const db = requireSupabase();
  const existing = await db
    .from("quiz_choices")
    .select("id")
    .eq("question_id", questionId)
    .is("deleted_at", null);
  if (existing.error) throw new Error(existing.error.message);
  const kept = new Set<number>();
  const correctIds: number[] = [];

  if (draft.kind === "multiple_choice") {
    for (const [index, choice] of draft.choices.entries()) {
      let choiceId = choice.id;
      if (choiceId) {
        const { error } = await db
          .from("quiz_choices")
          .update({ position: index, text: choice.text, deleted_at: null })
          .eq("id", choiceId)
          .eq("question_id", questionId);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await db
          .from("quiz_choices")
          .insert({ question_id: questionId, position: index, text: choice.text })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        choiceId = data.id;
      }
      kept.add(choiceId);
      if (choice.correct && choice.text.trim()) correctIds.push(choiceId);
    }
  }

  const remove = (existing.data ?? [])
    .map((row) => row.id)
    .filter((id) => !kept.has(id));
  if (remove.length > 0) {
    const { error } = await db
      .from("quiz_choices")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", remove);
    if (error) throw new Error(error.message);
  }

  const { error: clearError } = await db
    .from("quiz_answer_keys")
    .delete()
    .eq("question_id", questionId);
  if (clearError) throw new Error(clearError.message);

  if (draft.kind === "short_answer" && draft.answer.trim()) {
    const { error } = await db.from("quiz_answer_keys").insert({
      question_id: questionId,
      answer_text: draft.answer.trim(),
    });
    if (error) throw new Error(error.message);
    return;
  }
  if (correctIds.length > 0) {
    const { error } = await db.from("quiz_answer_keys").insert(
      correctIds.map((choiceId) => ({
        question_id: questionId,
        choice_id: choiceId,
      })),
    );
    if (error) throw new Error(error.message);
  }
}

export async function listQuizAttempts(quizId: number): Promise<QuizAttemptRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("quiz_attempts")
    .select(
      "id, quiz_id, student_profile_id, submitted_by, submitted_at, autograded, score, score_total, student:student_profiles(name, student_email), submitter:profiles!quiz_attempts_submitted_by_fkey(name, email)",
    )
    .eq("quiz_id", quizId)
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const student = Array.isArray(row.student) ? row.student[0] : row.student;
    const submitter = Array.isArray(row.submitter) ? row.submitter[0] : row.submitter;
    return {
      id: row.id,
      quizId: row.quiz_id,
      studentProfileId: row.student_profile_id,
      studentName: student?.name ?? "Student",
      studentEmail: student?.student_email ?? null,
      submittedBy: row.submitted_by,
      submitterName: submitter?.name || submitter?.email || "Parent",
      submitterEmail: submitter?.email ?? "",
      submittedAt: row.submitted_at,
      autograded: row.autograded,
      score: row.score,
      scoreTotal: row.score_total,
    };
  });
}

export async function listAttemptAnswers(
  attemptIds: readonly number[],
): Promise<QuizAttemptAnswerRecord[]> {
  if (attemptIds.length === 0) return [];
  const db = requireSupabase();
  const { data, error } = await db
    .from("quiz_attempt_answers")
    .select("attempt_id, question_id, prompt_snapshot, selected_summary, answer_text")
    .in("attempt_id", [...attemptIds]);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    attemptId: row.attempt_id,
    questionId: row.question_id,
    promptSnapshot: row.prompt_snapshot,
    selectedSummary: row.selected_summary,
    answerText: row.answer_text,
  }));
}

export async function listLinkedStudents(
  courseId: number,
  userId: string,
): Promise<LinkedStudent[]> {
  const db = requireSupabase();
  const links = await db
    .from("parent_student_links")
    .select("student_profile_id")
    .eq("parent_user_id", userId);
  if (links.error) throw new Error(links.error.message);
  const ids = (links.data ?? []).map((row) => row.student_profile_id);
  if (ids.length === 0) return [];
  const { data, error } = await db
    .from("enrollments")
    .select("student:student_profiles(id, name, student_email)")
    .eq("course_id", courseId)
    .eq("status", "active")
    .in("student_profile_id", ids);
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const student = Array.isArray(row.student) ? row.student[0] : row.student;
    if (!student) return [];
    return [
      {
        id: student.id,
        name: student.name,
        studentEmail: student.student_email,
      },
    ];
  });
}

export type SubmitQuizResult = {
  attemptId: number;
  autograded: boolean;
  score: number | null;
  scoreTotal: number | null;
};

export async function submitQuizAttempt(args: {
  quizId: number;
  studentProfileId: number;
  answers: { questionId: number; choiceIds: number[]; text: string }[];
}): Promise<SubmitQuizResult> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("submit_quiz_attempt", {
    p_quiz_id: args.quizId,
    p_student_profile_id: args.studentProfileId,
    p_answers: args.answers as unknown as Json,
  });
  if (error) throw new Error(error.message);
  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  return {
    attemptId: Number(record.attemptId),
    autograded: record.autograded === true,
    score: typeof record.score === "number" ? record.score : null,
    scoreTotal: typeof record.scoreTotal === "number" ? record.scoreTotal : null,
  };
}
