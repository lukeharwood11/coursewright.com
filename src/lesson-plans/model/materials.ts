export function uniqueMaterialIds(ids: number[]): number[] {
  const seen = new Set<number>();
  const next: number[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
}

export function toggleMaterialId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

export type LessonPlanPickerMaterial = {
  id: number;
  title: string;
  unitId: number | null;
  visibility: string;
  kind?: string;
};

export type LessonPlanPickerUnit = {
  id: number;
  title: string;
};

export type LessonPlanPickerGroup = {
  unitId: number | null;
  unitTitle: string | null;
  materials: LessonPlanPickerMaterial[];
};

export function groupMaterialsForPicker(
  materials: LessonPlanPickerMaterial[],
  units: LessonPlanPickerUnit[],
): LessonPlanPickerGroup[] {
  const groups: LessonPlanPickerGroup[] = [];
  const topLevel = materials.filter((material) => material.unitId == null);
  if (topLevel.length > 0) {
    groups.push({ unitId: null, unitTitle: null, materials: topLevel });
  }

  for (const unit of units) {
    const unitMaterials = materials.filter((material) => material.unitId === unit.id);
    if (unitMaterials.length === 0) continue;
    groups.push({
      unitId: unit.id,
      unitTitle: unit.title,
      materials: unitMaterials,
    });
  }

  return groups;
}

/** Narrow picker groups by material title or unit title (case-insensitive). */
export function filterPickerGroups(
  groups: LessonPlanPickerGroup[],
  query: string,
): LessonPlanPickerGroup[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups;

  return groups
    .map((group) => {
      const unitMatch = group.unitTitle?.toLowerCase().includes(needle) ?? false;
      if (unitMatch) return group;
      return {
        ...group,
        materials: group.materials.filter((material) =>
          material.title.toLowerCase().includes(needle),
        ),
      };
    })
    .filter((group) => group.materials.length > 0);
}
