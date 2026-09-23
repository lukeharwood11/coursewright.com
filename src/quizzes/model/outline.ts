export type OutlineMaterial = { id: number; position: number };
export type OutlineQuiz = { id: number; position: number };

export type OutlineItem =
  | { kind: "material"; id: number; position: number }
  | { kind: "quiz"; id: number; position: number };

export function mergeOutline(
  materials: readonly OutlineMaterial[],
  quizzes: readonly OutlineQuiz[],
): OutlineItem[] {
  const items: OutlineItem[] = [
    ...materials.map((material) => ({
      kind: "material" as const,
      id: material.id,
      position: material.position,
    })),
    ...quizzes.map((quiz) => ({
      kind: "quiz" as const,
      id: quiz.id,
      position: quiz.position,
    })),
  ];
  return items.sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    if (a.kind !== b.kind) return a.kind === "material" ? -1 : 1;
    return a.id - b.id;
  });
}

export function nextOutlinePosition(
  materials: readonly OutlineMaterial[],
  quizzes: readonly OutlineQuiz[],
): number {
  const positions = [...materials, ...quizzes].map((item) => item.position);
  if (positions.length === 0) return 0;
  return Math.max(...positions) + 1;
}
