import { requireSupabase } from "./client";

/** Org profile for this account in the student's organization. Creates one when missing. */
export async function parentOrgProfileIdForStudent(
  parentUserId: string,
  studentProfileId: number,
): Promise<number> {
  const db = requireSupabase();
  const { data: student, error: studentError } = await db
    .from("org_profiles")
    .select("organization_id")
    .eq("id", studentProfileId)
    .maybeSingle();
  if (studentError) throw new Error(studentError.message);
  if (!student) throw new Error("That student couldn’t be found.");

  const { data: existing, error: existingError } = await db
    .from("org_profiles")
    .select("id")
    .eq("organization_id", student.organization_id)
    .eq("user_id", parentUserId)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) return existing.id;

  const { data: account, error: accountError } = await db
    .from("profiles")
    .select("name, email")
    .eq("id", parentUserId)
    .maybeSingle();
  if (accountError) throw new Error(accountError.message);
  if (!account) throw new Error("That parent couldn’t be found.");

  const { data: created, error: createError } = await db
    .from("org_profiles")
    .insert({
      organization_id: student.organization_id,
      name: account.name.trim() || account.email,
      email: account.email,
      user_id: parentUserId,
      counts_as_student: false,
    })
    .select("id")
    .maybeSingle();
  if (createError) throw new Error(createError.message);
  if (!created) throw new Error("You don’t have permission to add that parent.");
  return created.id;
}
