import { requireSupabase } from "./client";
import {
  courseSearchHref,
  materialSearchHref,
  unitSearchHref,
} from "@/search/model/paths";
import { searchResultLimit, toPrefixTsQuery } from "@/search/model/query";
import type { SearchResult, SearchTypeFilter } from "@/search/model/results";

export const searchQueryKeys = {
  org: (organizationId: number, query: string, typeFilter: SearchTypeFilter) =>
    ["search", "org", organizationId, query, typeFilter] as const,
};

type FtsOptions = {
  organizationId: number;
  orgSlug: string;
  query: string;
  scopedToType: boolean;
};

type CourseHit = {
  id: number;
  title: string;
};

type UnitHit = {
  id: number;
  title: string;
  course_id: number | null;
};

type MaterialHit = {
  id: number;
  title: string;
  course_id: number | null;
  unit_id: number | null;
};

type FileHit = {
  id: number;
  filename: string;
};

type FileMaterialHit = {
  id: number;
  title: string;
  course_id: number | null;
  unit_id: number | null;
  file_id: number | null;
};

type MaterialRef = {
  id: number;
  title: string;
  course_id: number | null;
  unit_id: number | null;
  deleted_at: string | null;
};

type FileBlockHit = {
  file_id: number | null;
  material: MaterialRef | MaterialRef[] | null;
};

const FTS = { config: "english" } as const;

export async function searchCourses(args: FtsOptions): Promise<SearchResult[]> {
  const tsQuery = toPrefixTsQuery(args.query);
  if (!tsQuery) return [];

  const db = requireSupabase();
  const { data, error } = await db
    .from("courses")
    .select("id, title")
    .eq("organization_id", args.organizationId)
    .textSearch("search_vector", tsQuery, FTS)
    .order("title")
    .limit(searchResultLimit(args.scopedToType));

  if (error) throw new Error(error.message);

  return ((data ?? []) as CourseHit[]).map((row) => ({
    id: `course:${row.id}`,
    type: "course" as const,
    title: row.title,
    href: courseSearchHref(args.orgSlug, row.id),
  }));
}

export async function searchUnits(args: FtsOptions): Promise<SearchResult[]> {
  const tsQuery = toPrefixTsQuery(args.query);
  if (!tsQuery) return [];

  const db = requireSupabase();
  const { data, error } = await db
    .from("units")
    .select("id, title, course_id")
    .eq("organization_id", args.organizationId)
    .not("course_id", "is", null)
    .is("deleted_at", null)
    .textSearch("search_vector", tsQuery, FTS)
    .order("title")
    .limit(searchResultLimit(args.scopedToType));

  if (error) throw new Error(error.message);

  return ((data ?? []) as UnitHit[]).flatMap((row) => {
    if (row.course_id == null) return [];
    return [
      {
        id: `unit:${row.id}`,
        type: "unit" as const,
        title: row.title,
        href: unitSearchHref({
          orgSlug: args.orgSlug,
          courseId: row.course_id,
          unitId: row.id,
        }),
      },
    ];
  });
}

export async function searchMaterials(args: FtsOptions): Promise<SearchResult[]> {
  const tsQuery = toPrefixTsQuery(args.query);
  if (!tsQuery) return [];

  const db = requireSupabase();
  const { data, error } = await db
    .from("materials")
    .select("id, title, course_id, unit_id")
    .eq("organization_id", args.organizationId)
    .not("course_id", "is", null)
    .is("deleted_at", null)
    .textSearch("search_vector", tsQuery, FTS)
    .order("title")
    .limit(searchResultLimit(args.scopedToType));

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

export async function searchFiles(args: FtsOptions): Promise<SearchResult[]> {
  const tsQuery = toPrefixTsQuery(args.query);
  if (!tsQuery) return [];

  const db = requireSupabase();
  const { data, error } = await db
    .from("files")
    .select("id, filename")
    .eq("organization_id", args.organizationId)
    .is("deleted_at", null)
    .textSearch("search_vector", tsQuery, FTS)
    .order("filename")
    .limit(searchResultLimit(args.scopedToType));

  if (error) throw new Error(error.message);

  const files = (data ?? []) as FileHit[];
  if (files.length === 0) return [];

  const destinations = await loadFileDestinations(
    files.map((file) => file.id),
    args.organizationId,
  );
  const byFileId = new Map(files.map((file) => [file.id, file]));

  return destinations.flatMap((dest) => {
    const file = byFileId.get(dest.fileId);
    if (!file) return [];
    return [
      {
        id: `file:${file.id}:material:${dest.materialId}`,
        type: "file" as const,
        title: file.filename,
        detail: dest.materialTitle,
        href: materialSearchHref({
          orgSlug: args.orgSlug,
          courseId: dest.courseId,
          materialId: dest.materialId,
          unitId: dest.unitId,
        }),
      },
    ];
  });
}

type FileDestination = {
  fileId: number;
  materialId: number;
  materialTitle: string;
  courseId: number;
  unitId: number | null;
};

async function loadFileDestinations(
  fileIds: number[],
  organizationId: number,
): Promise<FileDestination[]> {
  const db = requireSupabase();
  const [materialsResult, blocksResult] = await Promise.all([
    db
      .from("materials")
      .select("id, title, course_id, unit_id, file_id")
      .eq("organization_id", organizationId)
      .in("file_id", fileIds)
      .not("course_id", "is", null)
      .is("deleted_at", null),
    db
      .from("blocks")
      .select(
        "file_id, material:materials!blocks_material_id_fkey(id, title, course_id, unit_id, deleted_at)",
      )
      .in("file_id", fileIds)
      .is("deleted_at", null),
  ]);

  if (materialsResult.error) throw new Error(materialsResult.error.message);
  if (blocksResult.error) throw new Error(blocksResult.error.message);

  const destinations: FileDestination[] = [];
  const seen = new Set<string>();

  function add(dest: FileDestination) {
    const key = `${dest.fileId}:${dest.materialId}`;
    if (seen.has(key)) return;
    seen.add(key);
    destinations.push(dest);
  }

  for (const row of (materialsResult.data ?? []) as FileMaterialHit[]) {
    if (row.file_id == null || row.course_id == null) continue;
    add({
      fileId: row.file_id,
      materialId: row.id,
      materialTitle: row.title,
      courseId: row.course_id,
      unitId: row.unit_id,
    });
  }

  for (const row of (blocksResult.data ?? []) as FileBlockHit[]) {
    if (row.file_id == null) continue;
    const material = Array.isArray(row.material)
      ? row.material[0]
      : row.material;
    if (!material || material.deleted_at != null || material.course_id == null) {
      continue;
    }
    add({
      fileId: row.file_id,
      materialId: material.id,
      materialTitle: material.title,
      courseId: material.course_id,
      unitId: material.unit_id,
    });
  }

  return destinations;
}