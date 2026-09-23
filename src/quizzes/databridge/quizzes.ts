import type { Json } from "@/infrastructure/supabase/database.types";
import {
  parseMaterialVisibility,
  type MaterialVisibility,
} from "@/materials/model/visibility";
import {
  clampAnswerLines,
  parseCourseQuizKind,
  type QuizQuestionKind,
} from "@/quizzes/model/quiz";
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

export type QuizMatchPromptRecord = {
  id: number;
  questionId: number;
  position: number;
  text: string;
};

export type QuizMatchOptionRecord = {
  id: number;
  questionId: number;
  position: number;
  text: string;
};

export type QuizMatchKeyRecord = {
  promptId: number;
  optionId: number;
};

export type QuizMatchPairDraft = {
  promptId: number | null;
  optionId: number | null;
  left: string;
  right: string;
};

export type QuizQuestionRecord = {
  id: number;
  quizId: number;
  position: number;
  prompt: string;
  kind: QuizQuestionKind;
  points: number;
  choices: QuizChoiceRecord[];
  prompts: QuizMatchPromptRecord[];
  options: QuizMatchOptionRecord[];
  matchKeys: QuizMatchKeyRecord[];
  pairs: QuizMatchPairDraft[];
  answer: string;
  answerLines: number | null;
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
  points: number;
  choices: QuizChoiceDraft[];
  pairs: QuizMatchPairDraft[];
  answer: string;
  answerLines: number;
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
  teacherGradedAt: string | null;
  score: number | null;
  scoreTotal: number | null;
};

export type QuizAttemptAnswerRecord = {
  attemptId: number;
  questionId: number;
  promptSnapshot: string;
  selectedSummary: string;
  answerText: string;
  choiceIds: number[];
  matchPairs: { leftId: number; rightId: number }[];
  pointsPossible: number | null;
  /** Autograder first pass. Null when this question was not autograded. */
  autoPoints: number | null;
  /** Teacher grade. When set, it replaces autoPoints. */
  teacherPoints: number | null;
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
  attemptSummaries: (courseId: number, studentKey: string) =>
    ["quizzes", "attempt-summaries", courseId, studentKey] as const,
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
    .select("id, quiz_id, position, prompt, kind, answer_lines, points")
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
  let prompts: {
    id: number;
    question_id: number;
    position: number;
    text: string;
  }[] = [];
  let options: {
    id: number;
    question_id: number;
    position: number;
    text: string;
  }[] = [];
  if (ids.length > 0) {
    const [promptRows, optionRows] = await Promise.all([
      db
        .from("quiz_match_prompts")
        .select("id, question_id, position, text")
        .in("question_id", ids)
        .is("deleted_at", null)
        .order("position"),
      db
        .from("quiz_match_options")
        .select("id, question_id, position, text")
        .in("question_id", ids)
        .is("deleted_at", null)
        .order("position"),
    ]);
    if (promptRows.error) throw new Error(promptRows.error.message);
    if (optionRows.error) throw new Error(optionRows.error.message);
    prompts = promptRows.data ?? [];
    options = optionRows.data ?? [];
  }
  const keys = await db
    .from("quiz_answer_keys")
    .select("question_id, choice_id, answer_text")
    .in("question_id", ids.length > 0 ? ids : [-1]);
  if (keys.error) throw new Error(keys.error.message);
  const matchKeyRows = await db
    .from("quiz_match_keys")
    .select("question_id, prompt_id, option_id")
    .in("question_id", ids.length > 0 ? ids : [-1]);
  if (matchKeyRows.error) throw new Error(matchKeyRows.error.message);
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
  const matchKeysByQuestion = new Map<number, { promptId: number; optionId: number }[]>();
  for (const key of matchKeyRows.data ?? []) {
    const list = matchKeysByQuestion.get(key.question_id) ?? [];
    list.push({ promptId: key.prompt_id, optionId: key.option_id });
    matchKeysByQuestion.set(key.question_id, list);
  }
  return (questions ?? []).map((question) => {
    const questionPrompts = prompts
      .filter((prompt) => prompt.question_id === question.id)
      .map((prompt) => ({
        id: prompt.id,
        questionId: prompt.question_id,
        position: prompt.position,
        text: prompt.text,
      }));
    const questionOptions = options
      .filter((option) => option.question_id === question.id)
      .map((option) => ({
        id: option.id,
        questionId: option.question_id,
        position: option.position,
        text: option.text,
      }));
    const matchKeys = matchKeysByQuestion.get(question.id) ?? [];
    const promptById = new Map(questionPrompts.map((prompt) => [prompt.id, prompt]));
    const optionById = new Map(questionOptions.map((option) => [option.id, option]));
    return {
      id: question.id,
      quizId: question.quiz_id,
      position: question.position,
      prompt: question.prompt,
      kind: parseCourseQuizKind(question.kind),
      choices: choices
        .filter((choice) => choice.question_id === question.id)
        .map((choice) => ({
          id: choice.id,
          questionId: choice.question_id,
          position: choice.position,
          text: choice.text,
          correct: correctByQuestion.get(question.id)?.has(choice.id) ?? false,
        })),
      prompts: questionPrompts,
      options: questionOptions,
      matchKeys,
      pairs: matchKeys
        .flatMap((key) => {
          const prompt = promptById.get(key.promptId);
          const option = optionById.get(key.optionId);
          if (!prompt || !option) return [];
          return [
            {
              promptId: prompt.id,
              optionId: option.id,
              left: prompt.text,
              right: option.text,
              position: prompt.position,
            },
          ];
        })
        .sort((a, b) => a.position - b.position)
        .map((pair) => ({
          promptId: pair.promptId,
          optionId: pair.optionId,
          left: pair.left,
          right: pair.right,
        })),
      answer: answerByQuestion.get(question.id) ?? "",
      answerLines: question.answer_lines,
      points: asPoints(question.points) ?? 1,
    };
  });
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
          points: draft.points,
          answer_lines: draft.kind === "long_answer" ? clampAnswerLines(draft.answerLines) : null,
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
          points: draft.points,
          answer_lines: draft.kind === "long_answer" ? clampAnswerLines(draft.answerLines) : null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      questionId = data.id;
    }
    kept.add(questionId);
    await syncChoices(questionId, draft);
    await syncMatch(questionId, draft);
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

  if (
    (draft.kind === "short_answer" || draft.kind === "long_answer" || draft.kind === "number") &&
    draft.answer.trim()
  ) {
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

async function syncMatch(questionId: number, draft: QuizQuestionDraft): Promise<void> {
  const db = requireSupabase();
  const [existingPrompts, existingOptions] = await Promise.all([
    db.from("quiz_match_prompts").select("id").eq("question_id", questionId).is("deleted_at", null),
    db.from("quiz_match_options").select("id").eq("question_id", questionId).is("deleted_at", null),
  ]);
  if (existingPrompts.error) throw new Error(existingPrompts.error.message);
  if (existingOptions.error) throw new Error(existingOptions.error.message);
  const keptPrompts = new Set<number>();
  const keptOptions = new Set<number>();
  const links: { promptId: number; optionId: number }[] = [];

  if (draft.kind === "matching") {
    for (const [index, pair] of draft.pairs.entries()) {
      if (pair.left.trim() === "" || pair.right.trim() === "") continue;
      const promptId = await upsertMatchSide(
        "quiz_match_prompts",
        questionId,
        pair.promptId,
        index,
        pair.left,
      );
      const optionId = await upsertMatchSide(
        "quiz_match_options",
        questionId,
        pair.optionId,
        index,
        pair.right,
      );
      keptPrompts.add(promptId);
      keptOptions.add(optionId);
      links.push({ promptId, optionId });
    }
  }

  const { error: clearError } = await db.from("quiz_match_keys").delete().eq("question_id", questionId);
  if (clearError) throw new Error(clearError.message);
  if (links.length > 0) {
    const { error } = await db.from("quiz_match_keys").insert(
      links.map((link) => ({
        question_id: questionId,
        prompt_id: link.promptId,
        option_id: link.optionId,
      })),
    );
    if (error) throw new Error(error.message);
  }

  await softDeleteMissing("quiz_match_prompts", existingPrompts.data ?? [], keptPrompts);
  await softDeleteMissing("quiz_match_options", existingOptions.data ?? [], keptOptions);
}

async function upsertMatchSide(
  table: "quiz_match_prompts" | "quiz_match_options",
  questionId: number,
  id: number | null,
  position: number,
  text: string,
): Promise<number> {
  const db = requireSupabase();
  if (id) {
    const { error } = await db
      .from(table)
      .update({ position, text, deleted_at: null })
      .eq("id", id)
      .eq("question_id", questionId);
    if (error) throw new Error(error.message);
    return id;
  }
  const { data, error } = await db
    .from(table)
    .insert({ question_id: questionId, position, text })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function softDeleteMissing(
  table: "quiz_match_prompts" | "quiz_match_options",
  existing: { id: number }[],
  kept: Set<number>,
): Promise<void> {
  const remove = existing.map((row) => row.id).filter((id) => !kept.has(id));
  if (remove.length === 0) return;
  const db = requireSupabase();
  const { error } = await db
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .in("id", remove);
  if (error) throw new Error(error.message);
}

export type QuizAttemptSummary = {
  id: number;
  quizId: number;
  studentProfileId: number;
  submittedAt: string;
  autograded: boolean;
  score: number | null;
  scoreTotal: number | null;
  /** Answers still without autograded or teacher points. */
  ungradedAnswerCount: number;
};

export async function listQuizAttempts(quizId: number): Promise<QuizAttemptRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("quiz_attempts")
    .select(
      "id, quiz_id, student_profile_id, submitted_by, submitted_at, autograded, teacher_graded_at, score, score_total, student:student_profiles(name, student_email), submitter:profiles!quiz_attempts_submitted_by_fkey(name, email)",
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
      teacherGradedAt: row.teacher_graded_at,
      score: asPoints(row.score),
      scoreTotal: asPoints(row.score_total),
    };
  });
}

/** Latest attempts for quizzes, newest first. RLS limits to what this person may read. */
export async function listQuizAttemptSummariesForQuizzes(
  quizIds: readonly number[],
  studentIds?: readonly number[],
): Promise<QuizAttemptSummary[]> {
  if (quizIds.length === 0) return [];
  const db = requireSupabase();
  let query = db
    .from("quiz_attempts")
    .select("id, quiz_id, student_profile_id, submitted_at, autograded, score, score_total")
    .in("quiz_id", [...quizIds])
    .order("submitted_at", { ascending: false });
  if (studentIds && studentIds.length > 0) {
    query = query.in("student_profile_id", [...studentIds]);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const attemptIds = rows.map((row) => row.id);
  const ungradedByAttempt = new Map<number, number>();
  if (attemptIds.length > 0) {
    const { data: answers, error: answersError } = await db
      .from("quiz_attempt_answers")
      .select("attempt_id, auto_points, teacher_points")
      .in("attempt_id", attemptIds);
    if (answersError) throw new Error(answersError.message);
    for (const answer of answers ?? []) {
      if (asPoints(answer.teacher_points) != null || asPoints(answer.auto_points) != null) continue;
      ungradedByAttempt.set(
        answer.attempt_id,
        (ungradedByAttempt.get(answer.attempt_id) ?? 0) + 1,
      );
    }
  }
  return rows.map((row) => ({
    id: row.id,
    quizId: row.quiz_id,
    studentProfileId: row.student_profile_id,
    submittedAt: row.submitted_at,
    autograded: row.autograded,
    score: asPoints(row.score),
    scoreTotal: asPoints(row.score_total),
    ungradedAnswerCount: ungradedByAttempt.get(row.id) ?? 0,
  }));
}

export async function gradeQuizAttempt(args: {
  attemptId: number;
  points: { questionId: number; points: number }[];
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.rpc("grade_quiz_attempt", {
    p_attempt_id: args.attemptId,
    p_points: args.points,
  });
  if (error) throw new Error(error.message);
}

export async function listAttemptAnswers(
  attemptIds: readonly number[],
): Promise<QuizAttemptAnswerRecord[]> {
  if (attemptIds.length === 0) return [];
  const db = requireSupabase();
  const { data, error } = await db
    .from("quiz_attempt_answers")
    .select(
      "attempt_id, question_id, prompt_snapshot, selected_summary, answer_text, choice_ids, match_pairs, points_possible, auto_points, teacher_points",
    )
    .in("attempt_id", [...attemptIds]);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    attemptId: row.attempt_id,
    questionId: row.question_id,
    promptSnapshot: row.prompt_snapshot,
    selectedSummary: row.selected_summary,
    answerText: row.answer_text,
    choiceIds: Array.isArray(row.choice_ids) ? row.choice_ids.map(Number) : [],
    matchPairs: parseMatchPairs(row.match_pairs),
    pointsPossible: asPoints(row.points_possible),
    autoPoints: asPoints(row.auto_points),
    teacherPoints: asPoints(row.teacher_points),
  }));
}

function asPoints(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMatchPairs(value: unknown): { leftId: number; rightId: number }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const leftId = Number(record.leftId);
    const rightId = Number(record.rightId);
    if (!Number.isFinite(leftId) || !Number.isFinite(rightId)) return [];
    return [{ leftId, rightId }];
  });
}

export async function listLinkedStudents(
  courseId: number,
  userId: string,
): Promise<LinkedStudent[]> {
  const db = requireSupabase();
  const [links, own] = await Promise.all([
    db.from("parent_student_links").select("student_profile_id").eq("parent_user_id", userId),
    db.from("student_profiles").select("id").eq("user_id", userId),
  ]);
  if (links.error) throw new Error(links.error.message);
  if (own.error) throw new Error(own.error.message);
  const ids = [
    ...new Set([
      ...(links.data ?? []).map((row) => row.student_profile_id),
      ...(own.data ?? []).map((row) => row.id),
    ]),
  ];
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
  answers: {
    questionId: number;
    choiceIds: number[];
    text: string;
    matches: { leftId: number; rightId: number }[];
  }[];
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
