import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, serviceClient, userFromRequest } from "../_shared/mod.ts";

type Body = {
  sourceCourseId?: unknown;
  title?: unknown;
  description?: unknown;
  location?: unknown;
  subject?: unknown;
  iconKey?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  gradeLevels?: unknown;
  status?: unknown;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user = await userFromRequest(request);
    if (!user) {
      return jsonResponse({ error: "Sign in to copy a course." }, 401);
    }

    const body = (await request.json()) as Body;
    const sourceCourseId = Number(body.sourceCourseId);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!Number.isFinite(sourceCourseId) || !title) {
      return jsonResponse({ error: "Pick a course and give the copy a title." }, 400);
    }

    const description = typeof body.description === "string" ? body.description.trim() : "";
    const location = typeof body.location === "string" ? body.location.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const iconKey =
      body.iconKey === null
        ? null
        : typeof body.iconKey === "string" && body.iconKey.trim()
          ? body.iconKey.trim()
          : undefined;
    const startDate = typeof body.startDate === "string" && body.startDate ? body.startDate : null;
    const endDate = typeof body.endDate === "string" && body.endDate ? body.endDate : null;
    const gradeLevels = Array.isArray(body.gradeLevels)
      ? body.gradeLevels.filter((item): item is string => typeof item === "string")
      : [];
    const status = body.status === "archived" ? "archived" : "active";

    const db = serviceClient();
    const { data: source, error: sourceError } = await db
      .from("courses")
      .select("id, organization_id, title, icon_key")
      .eq("id", sourceCourseId)
      .maybeSingle();
    if (sourceError) throw sourceError;
    if (!source) return jsonResponse({ error: "We couldn’t find that course." }, 404);

    const { data: membership, error: membershipError } = await db
      .from("memberships")
      .select("role")
      .eq("organization_id", source.organization_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (
      !membership ||
      !["owner", "admin", "instructor"].includes(membership.role)
    ) {
      return jsonResponse({ error: "You can’t copy a course in this organization." }, 403);
    }

    const { data: created, error: createError } = await db
      .from("courses")
      .insert({
        organization_id: source.organization_id,
        title,
        description,
        location,
        subject,
        start_date: startDate,
        end_date: endDate,
        grade_levels: gradeLevels,
        status,
        visibility: "unpublished",
        copied_from_course_id: source.id,
        icon_key: iconKey !== undefined ? iconKey : source.icon_key,
      })
      .select("id")
      .maybeSingle();
    if (createError) throw createError;
    if (!created) throw new Error("Course insert returned no id.");

    const palette = ["moss", "slate", "clay", "plum", "sea", "wine", "sand", "pine"] as const;
    const colorKey = palette[Math.abs(Number(created.id)) % palette.length];
    const { error: colorError } = await db
      .from("courses")
      .update({ color_key: colorKey })
      .eq("id", created.id);
    if (colorError) throw colorError;

    // Service-role insert skips private.on_course_created (no auth.uid). Mirror
    // that trigger: instructors teach what they create; owners/admins assign.
    if (membership.role === "instructor") {
      const { error: instructorError } = await db
        .from("course_instructors")
        .insert({ course_id: created.id, user_id: user.id })
        .select("id");
      if (instructorError && !instructorError.message.toLowerCase().includes("duplicate")) {
        throw instructorError;
      }
    }

    const { data: units, error: unitsError } = await db
      .from("units")
      .select("id, title, start_date, end_date, position")
      .eq("course_id", source.id)
      .is("deleted_at", null)
      .order("position");
    if (unitsError) throw unitsError;

    const unitMap = new Map<number, number>();
    for (const unit of units ?? []) {
      const { data: copied, error } = await db
        .from("units")
        .insert({
          organization_id: source.organization_id,
          course_id: created.id,
          title: unit.title,
          start_date: unit.start_date,
          end_date: unit.end_date,
          position: unit.position,
          copied_from_id: unit.id,
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (copied) unitMap.set(unit.id, copied.id);
    }

    const { data: materials, error: materialsError } = await db
      .from("materials")
      .select(
        "id, unit_id, title, description, kind, url, file_id, scheduled_date, due_date, due_at, due_timezone, accept_submissions, allow_submissions_past_due, submission_limit, submission_file_types, position, visibility",
      )
      .eq("course_id", source.id)
      .is("deleted_at", null)
      .order("position");
    if (materialsError) throw materialsError;

    const materialMap = new Map<number, number>();
    for (const material of materials ?? []) {
      const newUnitId =
        material.unit_id == null ? null : (unitMap.get(material.unit_id) ?? null);
      if (material.unit_id != null && newUnitId == null) continue;
      const { data: copied, error } = await db
        .from("materials")
        .insert({
          organization_id: source.organization_id,
          course_id: created.id,
          unit_id: newUnitId,
          title: material.title,
          description: material.description,
          kind: material.kind,
          url: material.url,
          file_id: material.file_id,
          scheduled_date: material.scheduled_date,
          due_date: material.due_date,
          due_at: material.due_at,
          due_timezone: material.due_timezone,
          accept_submissions: material.accept_submissions,
          allow_submissions_past_due: material.allow_submissions_past_due,
          submission_limit: material.submission_limit,
          submission_file_types: material.submission_file_types,
          position: material.position,
          visibility: material.visibility,
          copied_from_id: material.id,
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (copied) materialMap.set(material.id, copied.id);
    }

    const sourceMaterialIds = [...materialMap.keys()];
    if (sourceMaterialIds.length > 0) {
      const { data: blocks, error: blocksError } = await db
        .from("blocks")
        .select("id, material_id, position, kind, body, file_id")
        .in("material_id", sourceMaterialIds)
        .is("deleted_at", null)
        .order("position");
      if (blocksError) throw blocksError;
      for (const block of blocks ?? []) {
        const newMaterialId = materialMap.get(block.material_id);
        if (!newMaterialId) continue;
        const { error } = await db.from("blocks").insert({
          material_id: newMaterialId,
          position: block.position,
          kind: block.kind,
          body: block.body,
          file_id: block.file_id,
          copied_from_id: block.id,
        });
        if (error) throw error;
      }
    }

    const { data: quizzes, error: quizzesError } = await db
      .from("quizzes")
      .select(
        "id, unit_id, title, description, position, visibility, accepts_from, accepts_until, accepts_timezone, allow_multiple_attempts, autograde_and_show, share_answer_key_with_parents",
      )
      .eq("course_id", source.id)
      .is("deleted_at", null)
      .order("position");
    if (quizzesError) throw quizzesError;

    const quizMap = new Map<number, number>();
    for (const quiz of quizzes ?? []) {
      const newUnitId = quiz.unit_id == null ? null : (unitMap.get(quiz.unit_id) ?? null);
      if (quiz.unit_id != null && newUnitId == null) continue;
      const { data: copied, error } = await db
        .from("quizzes")
        .insert({
          organization_id: source.organization_id,
          course_id: created.id,
          unit_id: newUnitId,
          title: quiz.title,
          description: quiz.description,
          position: quiz.position,
          visibility: quiz.visibility,
          accepts_from: quiz.accepts_from,
          accepts_until: quiz.accepts_until,
          accepts_timezone: quiz.accepts_timezone,
          allow_multiple_attempts: quiz.allow_multiple_attempts,
          autograde_and_show: quiz.autograde_and_show,
          share_answer_key_with_parents: quiz.share_answer_key_with_parents,
          copied_from_id: quiz.id,
          created_by: user.id,
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (copied) quizMap.set(quiz.id, copied.id);
    }

    const sourceQuizIds = [...quizMap.keys()];
    if (sourceQuizIds.length > 0) {
      const { data: questions, error: questionsError } = await db
        .from("quiz_questions")
        .select("id, quiz_id, position, prompt, kind, answer_lines, points")
        .in("quiz_id", sourceQuizIds)
        .is("deleted_at", null)
        .order("position");
      if (questionsError) throw questionsError;

      const questionMap = new Map<number, number>();
      for (const question of questions ?? []) {
        const newQuizId = quizMap.get(question.quiz_id);
        if (!newQuizId) continue;
        const { data: copied, error } = await db
          .from("quiz_questions")
          .insert({
            quiz_id: newQuizId,
            position: question.position,
            prompt: question.prompt,
            kind: question.kind,
            points: question.points,
            answer_lines: question.answer_lines,
          })
          .select("id")
          .maybeSingle();
        if (error) throw error;
        if (copied) questionMap.set(question.id, copied.id);
      }

      const sourceQuestionIds = [...questionMap.keys()];
      if (sourceQuestionIds.length > 0) {
        const { data: choices, error: choicesError } = await db
          .from("quiz_choices")
          .select("id, question_id, position, text")
          .in("question_id", sourceQuestionIds)
          .is("deleted_at", null)
          .order("position");
        if (choicesError) throw choicesError;

        const choiceMap = new Map<number, number>();
        for (const choice of choices ?? []) {
          const newQuestionId = questionMap.get(choice.question_id);
          if (!newQuestionId) continue;
          const { data: copied, error } = await db
            .from("quiz_choices")
            .insert({
              question_id: newQuestionId,
              position: choice.position,
              text: choice.text,
            })
            .select("id")
            .maybeSingle();
          if (error) throw error;
          if (copied) choiceMap.set(choice.id, copied.id);
        }

        const { data: keys, error: keysError } = await db
          .from("quiz_answer_keys")
          .select("question_id, choice_id, answer_text")
          .in("question_id", sourceQuestionIds);
        if (keysError) throw keysError;
        const { data: prompts, error: promptsError } = await db
          .from("quiz_match_prompts")
          .select("id, question_id, position, text")
          .in("question_id", sourceQuestionIds)
          .is("deleted_at", null)
          .order("position");
        if (promptsError) throw promptsError;
        const promptMap = new Map<number, number>();
        for (const prompt of prompts ?? []) {
          const newQuestionId = questionMap.get(prompt.question_id);
          if (!newQuestionId) continue;
          const { data: copied, error } = await db
            .from("quiz_match_prompts")
            .insert({
              question_id: newQuestionId,
              position: prompt.position,
              text: prompt.text,
            })
            .select("id")
            .maybeSingle();
          if (error) throw error;
          if (copied) promptMap.set(prompt.id, copied.id);
        }
        const { data: options, error: optionsError } = await db
          .from("quiz_match_options")
          .select("id, question_id, position, text")
          .in("question_id", sourceQuestionIds)
          .is("deleted_at", null)
          .order("position");
        if (optionsError) throw optionsError;
        const optionMap = new Map<number, number>();
        for (const option of options ?? []) {
          const newQuestionId = questionMap.get(option.question_id);
          if (!newQuestionId) continue;
          const { data: copied, error } = await db
            .from("quiz_match_options")
            .insert({
              question_id: newQuestionId,
              position: option.position,
              text: option.text,
            })
            .select("id")
            .maybeSingle();
          if (error) throw error;
          if (copied) optionMap.set(option.id, copied.id);
        }
        const { data: matchKeys, error: matchKeysError } = await db
          .from("quiz_match_keys")
          .select("question_id, prompt_id, option_id")
          .in("question_id", sourceQuestionIds);
        if (matchKeysError) throw matchKeysError;
        for (const key of matchKeys ?? []) {
          const newQuestionId = questionMap.get(key.question_id);
          const newPromptId = promptMap.get(key.prompt_id);
          const newOptionId = optionMap.get(key.option_id);
          if (!newQuestionId || !newPromptId || !newOptionId) continue;
          const { error } = await db.from("quiz_match_keys").insert({
            question_id: newQuestionId,
            prompt_id: newPromptId,
            option_id: newOptionId,
          });
          if (error) throw error;
        }

        for (const key of keys ?? []) {
          const newQuestionId = questionMap.get(key.question_id);
          if (!newQuestionId) continue;
          const newChoiceId = key.choice_id == null ? null : (choiceMap.get(key.choice_id) ?? null);
          if (key.choice_id != null && newChoiceId == null) continue;
          const { error } = await db.from("quiz_answer_keys").insert({
            question_id: newQuestionId,
            choice_id: newChoiceId,
            answer_text: key.answer_text,
          });
          if (error) throw error;
        }
      }
    }

    return jsonResponse({ courseId: created.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn’t copy that course.";
    return jsonResponse({ error: message }, 500);
  }
});
