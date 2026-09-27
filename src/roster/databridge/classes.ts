import {
  listAssignableOrgStaff,
  type AssignableOrgPerson,
} from "@/organizations/databridge/assignableStaff";
import { listOrgMemberNames } from "@/organizations/databridge/orgNames";
import { rosterWriteErrorMessage } from "@/roster/model/studentProfile";
import type { ValidatedClass } from "@/roster/model/classGroup";
import { requireSupabase } from "./client";
import type { StudentSummary } from "./students";

export type ClassSummary = {
  id: number;
  organizationId: number;
  title: string;
};

export type ClassMember = {
  id: number;
  classId: number;
  student: StudentSummary;
};

export type ClassCatalogMeta = {
  leaders: ClassLeader[];
  memberCount: number;
};

export const classQueryKeys = {
  list: (orgId: number) => ["classes", "list", orgId] as const,
  /** Org roster Classes tab — includes leads and member counts; do not share cache with `list`. */
  listWithCatalog: (orgId: number) => ["classes", "listWithCatalog", orgId] as const,
  detail: (id: number) => ["classes", "detail", id] as const,
  members: (id: number) => ["classes", "members", id] as const,
  leaders: (id: number) => ["classes", "leaders", id] as const,
  forStudent: (studentId: number) => ["classes", "student", studentId] as const,
};

type ClassRow = {
  id: number;
  organization_id: number;
  title: string;
};

function toClassSummary(row: ClassRow): ClassSummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
  };
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listClasses(
  organizationId: number,
): Promise<ClassSummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("classes")
    .select("id, organization_id, title")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("title");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toClassSummary(row));
}

export async function listClassesCatalogMeta(
  classIds: number[],
): Promise<Record<number, ClassCatalogMeta>> {
  const metaFor = (): ClassCatalogMeta => ({
    leaders: [],
    memberCount: 0,
  });
  const byClassId: Record<number, ClassCatalogMeta> = {};
  for (const classId of classIds) {
    byClassId[classId] = metaFor();
  }
  if (classIds.length === 0) return byClassId;

  const db = requireSupabase();
  const [leaderResult, memberResult, classOrgs] = await Promise.all([
    db
      .from("class_leaders")
      .select("class_id, org_profile_id, user_id")
      .in("class_id", classIds),
    db.from("class_members").select("class_id").in("class_id", classIds),
    db.from("classes").select("id, organization_id").in("id", classIds),
  ]);

  if (leaderResult.error) throw new Error(leaderResult.error.message);
  if (memberResult.error) throw new Error(memberResult.error.message);
  if (classOrgs.error) throw new Error(classOrgs.error.message);

  const orgByClass = new Map<number, number>();
  for (const classGroup of classOrgs.data ?? []) {
    orgByClass.set(classGroup.id, classGroup.organization_id);
  }
  const namesByOrg = new Map<number, Map<number, { name: string; email: string }>>();
  for (const orgId of new Set(orgByClass.values())) {
    const names = await listOrgMemberNames(orgId);
    namesByOrg.set(orgId, new Map(names.map((person) => [person.id, person])));
  }

  const leadersByClass = new Map<number, ClassLeader[]>();
  for (const row of leaderResult.data ?? []) {
    const classId = row.class_id;
    if (typeof classId !== "number") continue;
    const person = namesByOrg.get(orgByClass.get(classId) ?? -1)?.get(row.org_profile_id);
    if (!person) continue;
    const list = leadersByClass.get(classId) ?? [];
    list.push({
      orgProfileId: row.org_profile_id,
      userId: row.user_id,
      name: person.name,
      email: person.email,
    });
    leadersByClass.set(classId, list);
  }

  for (const [classId, leaders] of leadersByClass) {
    byClassId[classId] = {
      ...byClassId[classId],
      leaders,
    };
  }

  for (const row of memberResult.data ?? []) {
    const classId = row.class_id;
    if (typeof classId !== "number") continue;
    byClassId[classId] = {
      ...byClassId[classId],
      memberCount: byClassId[classId].memberCount + 1,
    };
  }

  return byClassId;
}

export async function getClass(id: number): Promise<ClassSummary | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("classes")
    .select("id, organization_id, title")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toClassSummary(data);
}

export async function createClass(
  organizationId: number,
  input: ValidatedClass,
): Promise<ClassSummary> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("classes")
    .insert({
      organization_id: organizationId,
      title: input.title,
    })
    .select("id, organization_id, title")
    .maybeSingle();

  if (error) throw new Error(rosterWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to create a class.");
  }
  return toClassSummary(data);
}

export async function listClassMembers(classId: number): Promise<ClassMember[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("class_members")
    .select(
      "id, class_id, student:org_profiles(id, organization_id, name, grade_level, parent_email, email)",
    )
    .eq("class_id", classId)
    .order("created_at");

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const student = unwrapOne(row.student);
    if (!student) return [];
    return [
      {
        id: row.id,
        classId: row.class_id,
        student: {
          id: student.id,
          organizationId: student.organization_id,
          name: student.name,
          gradeLevel: student.grade_level,
          parentEmail: student.parent_email,
          studentEmail: student.email,
        },
      },
    ];
  });
}

export type ClassMembershipLabel = {
  studentProfileId: number;
  classId: number;
  title: string;
};

export async function listClassMembershipLabels(
  organizationId: number,
): Promise<ClassMembershipLabel[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("class_members")
    .select("student_profile_id, class_id, class:classes!inner(organization_id, title, deleted_at)");
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const classRow = unwrapOne(row.class);
    if (!classRow || classRow.deleted_at || classRow.organization_id !== organizationId) {
      return [];
    }
    return [
      {
        studentProfileId: row.student_profile_id,
        classId: row.class_id,
        title: classRow.title,
      },
    ];
  });
}

export async function listClassesForStudent(
  studentProfileId: number,
): Promise<ClassSummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("class_members")
    .select("class:classes(id, organization_id, title, deleted_at)")
    .eq("student_profile_id", studentProfileId);

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const classRow = unwrapOne(row.class);
    if (!classRow || classRow.deleted_at) return [];
    return [toClassSummary(classRow)];
  });
}

export async function addClassMember(
  classId: number,
  studentProfileId: number,
): Promise<void> {
  await addClassMembers(classId, [studentProfileId]);
}

export async function addClassMembers(
  classId: number,
  studentProfileIds: number[],
): Promise<void> {
  const uniqueIds = [
    ...new Set(studentProfileIds.filter((id) => Number.isFinite(id) && id > 0)),
  ];
  if (uniqueIds.length === 0) return;

  const db = requireSupabase();
  const { data: existingRows, error: existingError } = await db
    .from("class_members")
    .select("student_profile_id")
    .eq("class_id", classId)
    .in("student_profile_id", uniqueIds);

  if (existingError) throw new Error(rosterWriteErrorMessage(existingError));

  const already = new Set(
    (existingRows ?? []).map((row) => row.student_profile_id),
  );
  const toInsert = uniqueIds.filter((id) => !already.has(id));
  if (toInsert.length === 0) return;

  const { error } = await db.from("class_members").insert(
    toInsert.map((studentProfileId) => ({
      class_id: classId,
      student_profile_id: studentProfileId,
    })),
  );

  if (error) throw new Error(rosterWriteErrorMessage(error));
}

export async function removeClassMember(memberId: number): Promise<void> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("class_members")
    .delete()
    .eq("id", memberId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(rosterWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to remove this student.");
  }
}

export type ClassLeader = {
  orgProfileId: number;
  userId: string | null;
  name: string;
  email: string;
};

export type OrgStaffPickerPerson = AssignableOrgPerson;

export async function listClassLeaders(classId: number): Promise<ClassLeader[]> {
  const db = requireSupabase();
  const { data: classGroup, error: classError } = await db
    .from("classes")
    .select("organization_id")
    .eq("id", classId)
    .maybeSingle();
  if (classError) throw new Error(classError.message);
  if (!classGroup) return [];

  const { data, error } = await db
    .from("class_leaders")
    .select("org_profile_id, user_id")
    .eq("class_id", classId);
  if (error) throw new Error(error.message);

  const names = new Map(
    (await listOrgMemberNames(classGroup.organization_id)).map((person) => [
      person.id,
      person,
    ]),
  );
  return (data ?? []).flatMap((row) => {
    const person = names.get(row.org_profile_id);
    if (!person) return [];
    return [
      {
        orgProfileId: row.org_profile_id,
        userId: row.user_id,
        name: person.name,
        email: person.email,
      },
    ];
  });
}

export async function addClassLeader(
  classId: number,
  orgProfileId: number,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("class_leaders").insert({
    class_id: classId,
    org_profile_id: orgProfileId,
  });
  if (error) throw new Error(rosterWriteErrorMessage(error));
}

export async function removeClassLeader(
  classId: number,
  orgProfileId: number,
): Promise<void> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("class_leaders")
    .delete()
    .eq("class_id", classId)
    .eq("org_profile_id", orgProfileId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(rosterWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to change class leads.");
  }
}

export async function listOrgStaffForPicker(
  organizationId: number,
): Promise<OrgStaffPickerPerson[]> {
  return listAssignableOrgStaff(organizationId);
}

