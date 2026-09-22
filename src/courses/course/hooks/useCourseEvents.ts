import { useQuery } from "@tanstack/react-query";
import { eventQueryKeys, listEventsForCourse } from "@/events/databridge/events";

export function useCourseEvents(courseId: number, enabled: boolean) {
  return useQuery({
    queryKey: eventQueryKeys.course(courseId),
    queryFn: () => listEventsForCourse(courseId),
    enabled: enabled && Number.isFinite(courseId),
  });
}
