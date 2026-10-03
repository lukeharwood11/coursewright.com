import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createResourceMaterial,
  materialQueryKeys,
} from "@/materials/databridge/materials";
import { unitQueryKeys } from "@/units/databridge/units";

export function useCreateResourceMaterial(args: {
  organizationId: number;
  courseId: number;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (target: { folderId: number } | { itemId: number }) =>
      createResourceMaterial({
        organizationId: args.organizationId,
        courseId: args.courseId,
        folderId: "folderId" in target ? target.folderId : null,
        itemId: "itemId" in target ? target.itemId : null,
      }),
    onSuccess: async (material) => {
      await queryClient.invalidateQueries({
        queryKey: materialQueryKeys.list(args.courseId),
      });
      if (material.unitId != null) {
        await queryClient.invalidateQueries({
          queryKey: materialQueryKeys.unit(material.unitId),
        });
      }
      await queryClient.invalidateQueries({
        queryKey: unitQueryKeys.list(args.courseId),
      });
    },
  });
}
