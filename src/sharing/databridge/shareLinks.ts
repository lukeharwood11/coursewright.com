import { requireSupabase } from "./client";

export async function createResourceShareLink(args: {
  organizationId: number;
  courseId: number;
  materialId: number;
}): Promise<string> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("share_links")
    .insert({
      organization_id: args.organizationId,
      course_id: args.courseId,
      material_id: args.materialId,
      link_type: "resource",
    })
    .select("token")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.token) throw new Error("Couldn’t make a share link.");
  return data.token;
}
