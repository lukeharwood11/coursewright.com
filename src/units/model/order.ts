export function nextPosition(positions: number[]): number {
  if (positions.length === 0) return 0;
  return Math.max(...positions) + 1;
}

export function swapPositions<T extends { id: number; position: number }>(
  items: T[],
  id: number,
  direction: "up" | "down",
): Array<{ id: number; position: number }> | null {
  const ordered = [...items].sort((a, b) => a.position - b.position || a.id - b.id);
  const index = ordered.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const other = direction === "up" ? index - 1 : index + 1;
  if (other < 0 || other >= ordered.length) return null;
  const current = ordered[index];
  const neighbor = ordered[other];
  if (!current || !neighbor) return null;
  return [
    { id: current.id, position: neighbor.position },
    { id: neighbor.id, position: current.position },
  ];
}

export function positionPatchesForOrder<T extends { id: number; position: number }>(
  items: readonly T[],
  orderedIds: readonly number[],
): Array<{ id: number; position: number }> {
  const byId = new Map(items.map((item) => [item.id, item]));
  const patches: Array<{ id: number; position: number }> = [];
  for (let index = 0; index < orderedIds.length; index++) {
    const id = orderedIds[index];
    if (id == null) continue;
    const item = byId.get(id);
    if (!item || item.position === index) continue;
    patches.push({ id, position: index });
  }
  return patches;
}
