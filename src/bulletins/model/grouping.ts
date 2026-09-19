export type BulletinPickerMaterial = {
  id: number;
  title: string;
  unitId: number | null;
  visibility: string;
};

export type BulletinPickerUnit = {
  id: number;
  title: string;
};

export type BulletinPickerGroup = {
  unitId: number | null;
  unitTitle: string | null;
  materials: BulletinPickerMaterial[];
};

export function groupMaterialsForPicker(
  materials: BulletinPickerMaterial[],
  units: BulletinPickerUnit[],
): BulletinPickerGroup[] {
  const groups: BulletinPickerGroup[] = [];
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

export type CourseBulletinGroupKey = "available" | "upcoming" | "ended";

export function groupCourseBulletins<
  T extends { startDate: string; endDate: string },
>(
  bulletins: T[],
  today: string,
): Record<CourseBulletinGroupKey, T[]> {
  const groups: Record<CourseBulletinGroupKey, T[]> = {
    available: [],
    upcoming: [],
    ended: [],
  };
  for (const bulletin of bulletins) {
    if (today < bulletin.startDate) groups.upcoming.push(bulletin);
    else if (today > bulletin.endDate) groups.ended.push(bulletin);
    else groups.available.push(bulletin);
  }
  return groups;
}
