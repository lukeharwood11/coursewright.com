import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fileSignedUrl } from "@/materials/databridge/files";
import {
  listActiveEnrolledStudents,
  listMaterialSubmissions,
  submissionQueryKeys,
  turnInFiles,
} from "@/submissions/databridge/submissions";
import type { SubmissionFileType } from "@/submissions/model/fileTypes";

export function useMaterialSubmissions(args: {
  materialId: number;
  courseId: number;
  enabled: boolean;
}) {
  const queryClient = useQueryClient();
  const submissions = useQuery({
    queryKey: submissionQueryKeys.material(args.materialId),
    queryFn: () => listMaterialSubmissions(args.materialId),
    enabled: args.enabled && Number.isFinite(args.materialId),
  });
  const students = useQuery({
    queryKey: submissionQueryKeys.students(args.courseId),
    queryFn: () => listActiveEnrolledStudents(args.courseId),
    enabled: args.enabled && Number.isFinite(args.courseId),
  });

  const turnIn = useMutation({
    mutationFn: (input: {
      studentProfileId: number;
      files: File[];
      allowed: readonly SubmissionFileType[];
    }) =>
      turnInFiles({
        materialId: args.materialId,
        studentProfileId: input.studentProfileId,
        files: input.files,
        allowed: input.allowed,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: submissionQueryKeys.material(args.materialId),
      });
    },
  });

  async function openFile(storageRef: string, filename: string, download: boolean) {
    const url = await fileSignedUrl(
      storageRef,
      download ? { download: filename } : undefined,
    );
    if (download) {
      const link = document.createElement("a");
      link.href = url;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  return {
    submissions: submissions.data ?? [],
    students: students.data ?? [],
    loading: submissions.isLoading || students.isLoading,
    error: submissions.error ?? students.error,
    turningIn: turnIn.isPending,
    turnIn: turnIn.mutateAsync,
    openFile,
  };
}
