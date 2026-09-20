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

    const { error: instructorError } = await db
      .from("course_instructors")
      .insert({ course_id: created.id, user_id: user.id })
      .select("id");
    if (instructorError && !instructorError.message.toLowerCase().includes("duplicate")) {
      throw instructorError;
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
        "id, unit_id, title, description, kind, url, file_id, scheduled_date, due_date, position, visibility",
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

    return jsonResponse({ courseId: created.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn’t copy that course.";
    return jsonResponse({ error: message }, 500);
  }
});
