import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gradebookQueryKeys } from "@/grading/databridge/gradebook";
import {
  gradeMaterialSubmission,
  submissionQueryKeys,
} from "@/submissions/databridge/submissions";
import { toastCaughtError } from "@/ui/toast";
import { useMaterialSubmissions } from "./useMaterialSubmissions";

export function useSubmissionGrading(args: {
  materialId: number;
  courseId: number;
  enabled: boolean;
}) {
  const queryClient = useQueryClient();
  const list = useMaterialSubmissions(args);

  const save = useMutation({
    mutationFn: (input: { submissionId: number; points: number | null; feedback: string }) =>
      gradeMaterialSubmission(input),
    onSuccess: async () => {
      toast("Grade saved.");
      await queryClient.invalidateQueries({
        queryKey: submissionQueryKeys.material(args.materialId),
      });
      await queryClient.invalidateQueries({
        queryKey: gradebookQueryKeys.course(args.courseId),
      });
    },
    onError: (error: Error) => toastCaughtError(error),
  });

  return {
    submissions: list.submissions,
    loading: list.loading,
    signedUrl: list.signedUrl,
    downloadFile: list.downloadFile,
    saving: save.isPending,
    save: save.mutate,
  };
}
