import {
  createOrgPerson,
  findOrgProfileByEmail,
} from "@/organizations/databridge/orgNames";
import { findOrgPersonByEmail } from "@/organizations/databridge/staffInvites";
import { rosterWriteErrorMessage } from "@/roster/model/studentProfile";
import { requireSupabase } from "./client";

export async function removeParentFromStudent(input: {
  studentProfileId: number;
  parentOrgProfileId: number;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.rpc("remove_parent_from_student", {
    p_student_profile_id: input.studentProfileId,
    p_parent_org_profile_id: input.parentOrgProfileId,
  });
  if (error) throw new Error(rosterWriteErrorMessage(error));
}

export async function linkParentOrgProfileToStudent(
  parentOrgProfileId: number,
  studentProfileId: number,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("parent_student_links").insert({
    parent_org_profile_id: parentOrgProfileId,
    student_profile_id: studentProfileId,
  });
  if (error) {
    if (error.code === "23505") return;
    throw new Error(rosterWriteErrorMessage(error));
  }
}

export async function addParentToStudent(input: {
  organizationId: number;
  studentProfileId: number;
  name: string;
  email?: string;
}): Promise<{ parentOrgProfileId: number }> {
  const name = input.name.trim();
  if (!name) throw new Error("Enter a name.");
  const email = input.email?.trim().toLowerCase() ?? "";

  const db = requireSupabase();
  const { data: student, error: studentError } = await db
    .from("org_profiles")
    .select("organization_id, counts_as_student")
    .eq("id", input.studentProfileId)
    .maybeSingle();
  if (studentError) throw new Error(studentError.message);
  if (!student?.counts_as_student) {
    throw new Error("That student couldn’t be found.");
  }
  if (student.organization_id !== input.organizationId) {
    throw new Error("That student isn’t in this organization.");
  }

  if (email) {
    const orgMember = await findOrgPersonByEmail(input.organizationId, email);
    if (orgMember) {
      const parentOrgProfileId = await parentOrgProfileIdForStudent(
        orgMember.userId,
        input.studentProfileId,
      );
      await linkParentOrgProfileToStudent(
        parentOrgProfileId,
        input.studentProfileId,
      );
      return { parentOrgProfileId };
    }

    const existing = await findOrgProfileByEmail(input.organizationId, email);
    if (existing) {
      if (existing.id === input.studentProfileId) {
        throw new Error("A student can’t be their own parent.");
      }
      const { data: existingRow, error: existingError } = await db
        .from("org_profiles")
        .select("counts_as_student")
        .eq("id", existing.id)
        .maybeSingle();
      if (existingError) throw new Error(existingError.message);
      if (existingRow?.counts_as_student) {
        throw new Error("That email belongs to a student in this organization.");
      }
      await linkParentOrgProfileToStudent(existing.id, input.studentProfileId);
      return { parentOrgProfileId: existing.id };
    }
  }

  const created = await createOrgPerson({
    organizationId: input.organizationId,
    name,
    email: email || null,
  });
  await linkParentOrgProfileToStudent(created.id, input.studentProfileId);
  return { parentOrgProfileId: created.id };
}

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
