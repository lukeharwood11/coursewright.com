import { requireSupabase } from "./client";

export type SubmitFeedbackInput = {
  userId: string;
  organizationId: number | null;
  name: string;
  email: string;
  orgName: string | null;
  orgSlug: string | null;
  role: string | null;
  pagePath: string;
  message: string;
  userAgent: string;
};

export async function submitFeedback(
  input: SubmitFeedbackInput,
): Promise<{ id: number }> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("feedback")
    .insert({
      user_id: input.userId,
      organization_id: input.organizationId,
      name: input.name,
      email: input.email,
      org_name: input.orgName,
      org_slug: input.orgSlug,
      role: input.role,
      page_path: input.pagePath,
      message: input.message,
      user_agent: input.userAgent,
    })
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Your note was saved but we couldn’t confirm it.");

  return { id: data.id };
}
