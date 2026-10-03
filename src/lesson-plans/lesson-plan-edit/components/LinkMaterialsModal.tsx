import { useCallback, useMemo } from "react";
import {
  filterPickerGroups,
  groupMaterialsForPicker,
} from "@/lesson-plans/model/materials";
import type { MaterialRecord } from "@/materials/databridge/materials";
import type { UnitRecord } from "@/units/databridge/units";
import {
  MaterialOutlinePickerModal,
  type MaterialOutlinePickerModel,
} from "@/ui/MaterialOutlinePickerModal";

export function LinkMaterialsModal({
  open,
  dayLabel,
  materials,
  units,
  selectedIds,
  onToggle,
  onClose,
}: {
  open: boolean;
  dayLabel: string;
  materials: MaterialRecord[];
  units: UnitRecord[];
  selectedIds: number[];
  onToggle: (materialId: number) => void;
  onClose: () => void;
}) {
  const baseGroups = useMemo(
    () =>
      groupMaterialsForPicker(
        materials.map((material) => ({
          id: material.id,
          title: material.title,
          unitId: material.unitId,
          visibility: material.visibility,
          kind: material.kind,
        })),
        units,
      ),
    [materials, units],
  );

  const getFilteredModel = useCallback(
    (query: string): MaterialOutlinePickerModel => ({
      kind: "groups",
      groups: filterPickerGroups(baseGroups, query),
    }),
    [baseGroups],
  );

  return (
    <MaterialOutlinePickerModal
      open={open}
      title="Link materials"
      description={`Choose materials for ${dayLabel}. Families only see published ones.`}
      catalogCount={materials.length}
      getFilteredModel={getFilteredModel}
      selectedIds={selectedIds}
      onToggle={onToggle}
      emptyCatalogMessage="Add materials to this course first."
      onClose={onClose}
    />
  );
}
