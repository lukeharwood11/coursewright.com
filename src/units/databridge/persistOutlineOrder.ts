import { updateMaterial } from "@/materials/databridge/materials";
import { updateQuiz } from "@/quizzes/databridge/quizzes";
import type { OutlinePositionPatch } from "@/quizzes/model/outline";

export async function persistOutlinePositionPatches(
  patches: readonly OutlinePositionPatch[],
): Promise<void> {
  if (patches.length === 0) return;
  await Promise.all(
    patches.map((patch) =>
      patch.kind === "material"
        ? updateMaterial(patch.id, { position: patch.position })
        : updateQuiz(patch.id, { position: patch.position }),
    ),
  );
}
