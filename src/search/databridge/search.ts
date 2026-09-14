import { requireSupabase } from "./client";
import { courseSearchHref, materialSearchHref } from "@/search/model/paths";
import {
  searchResultLimit,
  toIlikePattern,
} from "@/search/model/query";
import type { SearchResult } from "@/search/model/results";

export const searchQueryKeys = {
  org: (organizationId: number, query: string) =>
    ["search", "org", organizationId, query] as const,
};

type CourseHit = {
  id: number;
  title: string;
};

type MaterialHit = {
  id: number;
  title: string;
  course_id: number | null;
  unit_id: number | null;
};

export async function searchCoursesByTitle(args: {
  organizationId: number;
  orgSlug: string;
  query: string;
}): Promise<SearchResult[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("courses")
    .select("id, title")
    .eq("organization_id", args.organizationId)
    .ilike("title", toIlikePattern(args.query))
    .order("title")
    .limit(searchResultLimit());

  if (error) throw new Error(error.message);

  return ((data ?? []) as CourseHit[]).map((row) => ({
    id: `course:${row.id}`,
    type: "course" as const,
    title: row.title,
    href: courseSearchHref(args.orgSlug, row.id),
  }));
}

export async function searchMaterialsByTitle(args: {
  organizationId: number;
  orgSlug: string;
  query: string;
}): Promise<SearchResult[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("materials")
    .select("id, title, course_id, unit_id")
    .eq("organization_id", args.organizationId)
    .not("course_id", "is", null)
    .is("deleted_at", null)
    .ilike("title", toIlikePattern(args.query))
    .order("title")
    .limit(searchResultLimit());

  if (error) throw new Error(error.message);

  return ((data ?? []) as MaterialHit[]).flatMap((row) => {
    if (row.course_id == null) return [];
    return [
      {
        id: `material:${row.id}`,
        type: "material" as const,
        title: row.title,
        href: materialSearchHref({
          orgSlug: args.orgSlug,
          courseId: row.course_id,
          materialId: row.id,
          unitId: row.unit_id,
        }),
      },
    ];
  });
}
