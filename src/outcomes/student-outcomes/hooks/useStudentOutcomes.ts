import { useQuery } from "@tanstack/react-query";
import { listFamilyOutcomeRatings, ratingQueryKeys } from "@/outcomes/databridge/ratings";
import { groupFamilyRatings } from "@/outcomes/model/outcomes";

export function useStudentOutcomes(studentId: number) {
  const query = useQuery({
    queryKey: ratingQueryKeys.student(studentId),
    queryFn: () => listFamilyOutcomeRatings(studentId),
    enabled: Number.isFinite(studentId),
  });

  return {
    groups: groupFamilyRatings(query.data ?? []),
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
  };
}
