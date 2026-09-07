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
