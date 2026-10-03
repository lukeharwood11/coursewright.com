import {
  filterPickerGroups,
  flattenPickerGroups,
  groupMaterialsForPicker,
  type LessonPlanPickerGroup,
  type LessonPlanPickerMaterial,
  type LessonPlanPickerUnit,
} from "@/lesson-plans/model/materials";
import type { AttachableMaterial } from "@/discussions/databridge/discussions";

export function attachableToPickerMaterial(
  material: AttachableMaterial,
): LessonPlanPickerMaterial {
  return {
    id: material.id,
    title: material.title,
    unitId: material.unitId,
    visibility: "published",
    kind: material.kind,
  };
}

export function unitsForAttachableMaterials(
  materials: AttachableMaterial[],
): LessonPlanPickerUnit[] {
  const byId = new Map<number, string>();
  for (const material of materials) {
    if (material.unitId == null || !material.unitTitle) continue;
    byId.set(material.unitId, material.unitTitle);
  }
  return [...byId.entries()]
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([id, title]) => ({ id, title }));
}

export type AttachablePickerCourseSection = {
  courseId: number;
  courseTitle: string;
  groups: LessonPlanPickerGroup[];
};

export type AttachablePickerLayout =
  | { mode: "singleCourse"; groups: LessonPlanPickerGroup[] }
  | { mode: "multiCourse"; courses: AttachablePickerCourseSection[] };

export function layoutAttachableMaterials(
  materials: AttachableMaterial[],
): AttachablePickerLayout {
  const courseIds = new Set(materials.map((row) => row.courseId));
  if (courseIds.size <= 1) {
    return {
      mode: "singleCourse",
      groups: groupMaterialsForPicker(
        materials.map(attachableToPickerMaterial),
        unitsForAttachableMaterials(materials),
      ),
    };
  }

  const byCourse = new Map<number, AttachableMaterial[]>();
  for (const material of materials) {
    const list = byCourse.get(material.courseId) ?? [];
    list.push(material);
    byCourse.set(material.courseId, list);
  }

  const courses: AttachablePickerCourseSection[] = [...byCourse.entries()]
    .map(([courseId, rows]) => ({
      courseId,
      courseTitle: rows[0]?.courseTitle ?? "Course",
      groups: groupMaterialsForPicker(
        rows.map(attachableToPickerMaterial),
        unitsForAttachableMaterials(rows),
      ),
    }))
    .sort((left, right) => left.courseTitle.localeCompare(right.courseTitle));

  return { mode: "multiCourse", courses };
}

export function filterAttachableLayout(
  layout: AttachablePickerLayout,
  query: string,
): AttachablePickerLayout {
  if (layout.mode === "singleCourse") {
    return {
      mode: "singleCourse",
      groups: filterPickerGroups(layout.groups, query),
    };
  }

  const needle = query.trim().toLowerCase();
  if (!needle) return layout;

  const courses = layout.courses
    .map((course) => {
      const courseMatch = course.courseTitle.toLowerCase().includes(needle);
      if (courseMatch) return course;
      return {
        ...course,
        groups: filterPickerGroups(course.groups, query),
      };
    })
    .filter((course) => course.groups.some((group) => group.materials.length > 0));

  return { mode: "multiCourse", courses };
}

export type AttachableFlatRow = {
  material: LessonPlanPickerMaterial;
  unitTitle: string | null;
  courseTitle?: string | null;
};

export function flattenAttachableLayout(
  layout: AttachablePickerLayout,
): AttachableFlatRow[] {
  if (layout.mode === "singleCourse") {
    return flattenPickerGroups(layout.groups).map((row) => ({
      material: row.material,
      unitTitle: row.unitTitle,
    }));
  }

  const rows: AttachableFlatRow[] = [];
  for (const course of layout.courses) {
    for (const row of flattenPickerGroups(course.groups)) {
      rows.push({
        material: row.material,
        unitTitle: row.unitTitle,
        courseTitle: course.courseTitle,
      });
    }
  }
  return rows;
}
