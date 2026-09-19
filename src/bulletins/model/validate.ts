export type BulletinDraft = {
  title: string;
  body: string;
  startDate: string;
  endDate: string;
  materialIds: number[];
};

/** Prefill for a new bulletin — course title is the class name families know. */
export function defaultBulletinTitle(courseTitle: string): string {
  const name = courseTitle.trim();
  return name ? `This week in ${name}` : "This week";
}

export function validateBulletinDraft(draft: BulletinDraft): string | null {
  if (!draft.title.trim()) return "Add a title so families know what this is.";
  if (!draft.startDate) return "Choose a start date.";
  if (!draft.endDate) return "Choose an end date.";
  if (draft.endDate < draft.startDate) {
    return "The end date needs to be on or after the start date.";
  }
  return null;
}

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
