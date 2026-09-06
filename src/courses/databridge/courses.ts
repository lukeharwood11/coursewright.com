import { requireSupabase } from "./client";

export type CourseSummary = {
  id: string;
  organizationId: string;
  title: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
};

export const courseQueryKeys = {
  list: (orgId: string) => ["courses", "list", orgId] as const,
  detail: (id: string) => ["courses", "detail", id] as const,
};

export async function listCourses(organizationId: string): Promise<CourseSummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("courses")
    .select("id, organization_id, title, status, start_date, end_date")
    .eq("organization_id", organizationId)
    .order("title");

  if (error) throw new Error(error.message);
  return (data ?? []).map(toCourseSummary);
}

export async function getCourse(id: string): Promise<CourseSummary | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("courses")
    .select("id, organization_id, title, status, start_date, end_date")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toCourseSummary(data);
}

function toCourseSummary(row: {
  id: string;
  organization_id: string;
  title: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
}): CourseSummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
  };
}
