import { useQuery } from "@tanstack/react-query";
import { eventQueryKeys, listEventsForClass } from "@/events/databridge/events";

export function useClassEvents(classId: number, enabled: boolean) {
  return useQuery({
    queryKey: eventQueryKeys.classGroup(classId),
    queryFn: () => listEventsForClass(classId),
    enabled: enabled && Number.isFinite(classId),
  });
}
